import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';

import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usersGameLibrary = this.afs.collection<User[]>("usersGameLibrary");
  public userLogged: User;

  constructor(public afAuth: AngularFireAuth, private afs: AngularFirestore) { }

  getLoggedInUser(): Promise<User> {
    return new Promise((resolve, reject) => {
      console.log("getLoggedInUser", this.userLogged);
      if (this.userLogged) { resolve(this.userLogged); }
      this.afAuth.auth.onAuthStateChanged(user => {
        if (user) {
          let sub = this.usersGameLibrary.doc(user.uid).valueChanges().subscribe((userLibrary: User) => {
            sub.unsubscribe();
            this.userLogged = userLibrary;
            resolve(userLibrary);
          });
        } else {
          resolve(null);
        }
      }), (err) => resolve(null);
    });
  }

  loginEmailPass(loginData: {email: string, password: string}) {
    return new Promise<any>((resolve, reject) => {
      this.afAuth.auth.signInWithEmailAndPassword(loginData.email, loginData.password).then(response => {
        this.getLoggedInUser().then(userLogged => {
          console.log("loginEmailPass signInWithEmailAndPassword", userLogged);
          if (userLogged === undefined) {
            // console.log("initializeUser");
            this.userLogged = this.initializeUser(response);
          } else { this.userLogged = userLogged; }
          resolve(response);
        }, err => reject(err));
      }, err => reject(err));
    });
  }

  loginSocialNetwork(provider) {
    return new Promise<any>((resolve, reject) => {
      this.afAuth.auth.signInWithPopup(provider).then(response => {
        this.getLoggedInUser().then(userLogged => {
          console.log("loginSocialNetwork signInWithPopup", userLogged);
          if (userLogged === undefined) {
            // console.log("initializeUser");
            this.userLogged = this.initializeUser(response);
          } else { this.userLogged = userLogged; }
          resolve(response);
        }, err => reject(err));
        resolve(response);
      }, err => reject(err));
    });
  }

  logout() {
    this.userLogged = null;
    this.afAuth.auth.signOut();
  }

  initializeUser(userData: firebase.auth.UserCredential): User {
    let user = new User(userData);
    this.afs.collection<User[]>("usersGameLibrary").doc(userData.user.uid).set(Object.assign({}, user));
    return user;
  }
}
