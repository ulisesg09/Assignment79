import { Component, OnInIt } from '@angular/core';
import { NavController, PopoverController, ModalController, AlertController } from 'ionic-angular';
import { MeteorObservable } from 'meteor-rxjs';
import * as Moment from 'moment';
import { Observable, Subscriber } from 'rxjs';
import { Chats, Messages, Users } from '../../../../imports/collections';
import { Chat, Message, MessageType } from '../../../../imports/models';
import { ChatsOptionsComponent } from './chats-options';
import { MessagesPage } from '../messages/messages';
import template from './chats.html';
import { NewChatComponent } from './new-chat';
 
@Component({
  template
})
export class ChatsPage implements OnInit {
  chats;
  senderId: string;
     
   constructor(
    private navCtrl: NavController,
    private popoverCtrl: PopoverController,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController) {
    this.senderId = Meteor.userId();
  }
 
  ngOnInit() {
     MeteorObservable.subscribe('chats').subscribe(() => {
      MeteorObservable.autorun().subscribe(() => {
        this.chats = this.findChats();
      });
    });
  }

    addChat(): void {
    const modal = this.modalCtrl.create(NewChatComponent);
    modal.present();
  }

  
  findChats(): Observable<Chat[]> {
    // Find chats and transform them
    return Chats.find().map(chats => {
      chats.forEach(chat => {
        chat.title = '';
        chat.picture = '';
 
        const receiverId = chat.memberIds.find(memberId => memberId !== this.senderId);
        const receiver = Users.findOne(receiverId);
 
        if (receiver) {
          chat.title = receiver.profile.name;
          chat.picture = receiver.profile.picture;
        }
 
        // This will make the last message reactive
        this.findLastChatMessage(chat._id).subscribe((message) => {
          chat.lastMessage = message;
        });
      });
 
      return chats;
    });
  }
 
  findLastChatMessage(chatId: string): Observable<Message> {
    return Observable.create((observer: Subscriber<Message>) => {
      const chatExists = () => !!Chats.findOne(chatId);
 
      // Re-compute until chat is removed
      MeteorObservable.autorun().takeWhile(chatExists).subscribe(() => {
        Messages.find({ chatId }, {
          sort: { createdAt: -1 }
        }).subscribe({
          next: (messages) => {
            // Invoke subscription with the last message found
            if (!messages.length) {
              return;
            }
 
            const lastMessage = messages[0];
            observer.next(lastMessage);
          },
          error: (e) => {
            observer.error(e);
          },
          complete: () => {
            observer.complete();
          }
        });
      });
    });
  }

showOptions(): void {
    const popover = this.popoverCtrl.create(ChatsOptionsComponent, {}, {
      cssClass: 'options-popover chats-options-popover'
    });
 
    popover.present();
  }
  
  showMessages(chat): void {
    this.navCtrl.push(MessagesPage, {chat});
  }
 
 
  private findChats(): Observable<any[]> {
    return Observable.of([
      {
        _id: '0',
        title: 'Ethan Gonzalez',
         picture: 'https://randomuser.me/api/portraits/thumb/men/1.jpg',
        lastMessage: {
          content: 'You on your way?',
          createdAt: Moment().subtract(1, 'hours').toDate(),
          type: MessageType.TEXT
        }
      },
      {
        _id: '1',
        title: 'Bryan Wallace',
        picture: 'https://randomuser.me/api/portraits/thumb/lego/1.jpg',
        lastMessage: {
          content: 'Hey, it\'s me',
          createdAt: Moment().subtract(2, 'hours').toDate(),
          type: MessageType.TEXT
        }
      },
      {
        _id: '2',
        title: 'Avery Stewart',
        picture: 'https://randomuser.me/api/portraits/thumb/women/1.jpg',
        lastMessage: {
          content: 'I should buy a boat',
          createdAt: Moment().subtract(1, 'days').toDate(),
          type: MessageType.TEXT
        }
      },
      {
        _id: '3',
        title: 'Katie Peterson',
        picture: 'https://randomuser.me/api/portraits/thumb/women/2.jpg',
        lastMessage: {
          content: 'Look at my mukluks!',
          createdAt: Moment().subtract(4, 'days').toDate(),
          type: MessageType.TEXT
        }
      },
      {
        _id: '4',
        title: 'Ray Edwards',
        picture: 'https://randomuser.me/api/portraits/thumb/men/2.jpg',
        lastMessage: {
          content: 'This is wicked good ice cream.',
          createdAt: Moment().subtract(2, 'weeks').toDate(),
          type: MessageType.TEXT
        }
       }
    ]);
   }
 
   removeChat(chat: Chat): void {
     MeteorObservable.call('removeChat', chat._id).subscribe({
      error: (e: Error) => {
        if (e) {
          this.handleError(e);
        }
      }
    });
  }
 
  handleError(e: Error): void {
    console.error(e);
 
    const alert = this.alertCtrl.create({
      buttons: ['OK'],
      message: e.message,
      title: 'Oops!'
    });
 
    alert.present();
   }
     showOptions(): void {
    const popover = this.popoverCtrl.create(ChatsOptionsComponent, {}, {
      cssClass: 'options-popover chats-options-popover'
    });
 
    popover.present();
  }
}