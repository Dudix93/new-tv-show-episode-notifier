import { Component } from '@angular/core';
import { NavController, AlertController, ToastController, LoadingController, FabContainer } from 'ionic-angular';
import { RestapiServiceProvider } from '../../providers/restapi-service/restapi-service';
import { Storage } from '@ionic/storage';
import { GlobalVars } from '../../app/globalVars';
import { InfoPage } from '../info/info';
import { Genre } from '../../models/genre';
import { DatePicker } from '@ionic-native/date-picker';

@Component({
  selector: 'page-browse',
  templateUrl: 'browse.html'
})

export class BrowsePage {

  //@ViewChild(Content) content: Content;

  animu:any;
  response:any;
  animes:Array<any> = []
  genres:Array<any> = []
  selectedGenres:Array<string> = [];
  searchResults:Array<any> = []
  searchString:string = ''
  order:string = 'asc'
  title_type:string = 'en'
  showGenres:boolean = false;
  notification = {
    same:true,
    hour:new Date()
  }
  toast = this.toastCtrl.create();

  // client_credentials:string = 'animunotifier-j0ybs';
  // client_secret:string = 'UqdeljBAhwnTPoT5TPV';

  constructor(
    public navCtrl: NavController,
    public restApi: RestapiServiceProvider,
    public storage: Storage,
    public globalVars: GlobalVars,
    public datePicker: DatePicker,
    public alertCtrl: AlertController,
    public toastCtrl: ToastController,
    public loadingCtrl:LoadingController) {
        this.getAnimes();
        // this.getGenres();
      // this.restApi.authorize({grant_type:"client_credentials",client_id:this.client_credentials,client_secret:this.client_secret}).then(data=>{
      //   this.response = data;
      //   this.globalVars.setToken(this.response.json().access_token);
      //   this.getAnimes();
      //   this.getGenres();
      // });
  }

  getAnimes(){
    let loading = this.loadingCtrl.create({
      spinner: 'crescent',
      content: 'Fetching anime list...'
    });
    this.showGenres == false ? loading.present() :'';
    this.animes = [];
    this.searchString != null && this.searchString != '' ? this.searchString = this.searchString.toLocaleLowerCase() :'';
    // for(let i=1; i<20; i++){
      this.restApi.getAnime().then(data=>{
        this.animu = data['data'];
        this.animu.forEach(a => {
          this.animes.push(a);
          this.animes.sort(this.compareValues('en_jp','asc'));
        });
        loading.dismiss();
      });
    // }
  }

  getGenres(){
    this.restApi.getGenres().then(data=>{
      let gen:any = data;
      gen.forEach(g => {
        this.genres.push(new Genre(false,g.genre));
      });
    });
  }

  selectGenre(genre_name:string){
    this.genres.forEach(g=>{
      if(g.name == genre_name){
        g.selected = true;
      }
    });
    this.selectedGenres.push(genre_name);
  }

  unselectGenre(genre_name:string){
    this.genres.forEach(g=>{
      if(g.name == genre_name){
        g.selected = false;
      }
    });
    this.selectedGenres.splice(this.selectedGenres.indexOf(genre_name),1);
    if(this.showGenres == false) this.searchByGenre();
  }

  showCategories(){
    this.dismissToast();
    this.showGenres = true;
    this.getAnimes();
    //this.content.resize();
  }

  searchByGenre(){
    //this.content.resize();
    this.searchString = '';
    let selectedAnimes:Array<any> = [];
    this.showGenres = false;
    this.animes.forEach(a=>{
      let found = 0;
      this.selectedGenres.forEach(g=>{
        if(a.genres.includes(g)){
          found++;
        }
      });
      if(found == this.selectedGenres.length){
        selectedAnimes.push(a);
      }
    });
    this.searchResults = selectedAnimes;
  }  

  search(title_type){
    this.searchResults = [];
    this.animes.forEach(a=>{
      let title = undefined != a.attributes.titles[title_type] ? title_type : 'en_jp';
      if(a.attributes.titles[title].toLocaleLowerCase().includes(this.searchString.toLocaleLowerCase())){
        this.searchResults.push(a);
      }
    });
  }

  clearSearch(){
    this.searchResults = [];
    this.searchString = '';
    this.toast.dismiss();
    console.log('search bar cleared');
  }

  clearSelectedGenres(){
    this.getAnimes();
    this.selectedGenres = [];
    this.genres.forEach(g=>{
      g.selected = false;
    });
  }

  moreInfo(anime:any){
    this.restApi.getData(anime.id).then(data=>{
      this.navCtrl.push(InfoPage,{"anime":data});
    });
  }

  changeOrder(fab: FabContainer){
    'asc' === this.order ? this.order = 'desc' : this.order = 'asc'
     0 != this.searchResults.length ? 
     this.searchResults.sort(this.compareValues(this.title_type,this.order)) :
     this.animes.sort(this.compareValues(this.title_type,this.order));
    fab.close();
  }

  changeTitleType(fab: FabContainer){
    if(this.title_type == 'en_jp')this.title_type = 'ja_jp'
    else if(this.title_type == 'ja_jp')this.title_type = 'en'
    else this.title_type = 'en_jp'
    fab.close();
  }

  changeNotificationHour(fab: FabContainer){
    this.dismissToast();
    this.storage.get('notification_hour').then(data=>{
      if (data == null){
        this.notification.same = true;
        this.notification.hour = new Date();
      }
      else this.notification = data;
      let hour = {
        h:this.notification.hour.getHours(),
        m:(this.notification.hour.getMinutes() < 10) ? "0"+this.notification.hour.getMinutes() : +this.notification.hour.getMinutes()
      }
      let alert = this.alertCtrl.create({
        title: 'Notification hour:',
        inputs: [
          {
            name: 'original_hour',
            type: 'checkbox',
            label: 'Same as original airing hour',
            checked: this.notification.same
          }
        ],
        buttons: [
          {
            text: "Own hour - "+hour.h+":"+hour.m,
            handler: data => {
              this.datePicker.show({
                date: new Date(),
                mode: 'time',
                is24Hour: true,
                androidTheme: this.datePicker.ANDROID_THEMES.THEME_DEVICE_DEFAULT_LIGHT
              }).then(
                date => {
                  this.notification.hour = date;
                  this.storage.set('notification_hour',this.notification);
                  console.log("picked date: "+date);
                },
                err => console.log('Error occurred while getting date: ', err)
              );
            }
          },
          {
            text: "OK",
            handler: data => {
              if(data.length == 1)this.notification.same = true;
              else this.notification.same = false;
              console.log(this.notification);
              this.storage.set('notification_hour',this.notification)
            }
          }
        ]
      });
      alert.present();
    });
    fab.close();
  }

  compareValues(key, order = 'asc') {
    return function(a, b) {
    
      if(!a.attributes.titles.hasOwnProperty(key) || !b.attributes.titles.hasOwnProperty(key)) {
          return 0; 
      }
  
      const valueA = (typeof a.attributes.titles[key] === 'string') ? a.attributes.titles[key].toUpperCase() : a.attributes.titles[key];
      const valueB = (typeof b.attributes.titles[key] === 'string') ? b.attributes.titles[key].toUpperCase() : b.attributes.titles[key];
  
      let comparison = 0;
      if (valueA > valueB) {
        comparison = 1;
      } else if (valueA < valueB) {
        comparison = -1;
      }
      return (order == 'desc') ? (comparison * -1) : comparison
    };
  }

  dismissToast(){
    this.toast.dismiss();
  }

  showToast(message:string) {
    this.toast.dismiss();
    this.toast = this.toastCtrl.create({
      message: message,
      duration: 30000,
      position: 'middle',
      cssClass: "toast-message",
      dismissOnPageChange: true
    });
    this.toast.present();
  }

}

