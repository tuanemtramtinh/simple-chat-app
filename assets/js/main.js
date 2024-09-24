
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, get, set, push, onChildAdded, onValue, remove, child, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import * as Popper from 'https://cdn.jsdelivr.net/npm/@popperjs/core@^2/dist/esm/index.js';
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCsjri7q2V7GrOzIukIy83meQoJv3CZ4fA",
  authDomain: "chat-app-338e9.firebaseapp.com",
  projectId: "chat-app-338e9",
  storageBucket: "chat-app-338e9.appspot.com",
  messagingSenderId: "893510090386",
  appId: "1:893510090386:web:dfbd3349f5c801a7aa704b",
  databaseURL: 'https://chat-app-338e9-default-rtdb.asia-southeast1.firebasedatabase.app/'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase();

//Tính năng đăng kí 
const formRegister = document.querySelector('#form-register');
if (formRegister){
  formRegister.addEventListener('submit', (e) => {
    e.preventDefault();

    const fullName = e.target.fullName.value;
    const email = e.target.email.value;
    const password = e.target.password.value;

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;

        set(ref(db, 'users/' + user.uid), {
          fullName : fullName,
          email : email,
          password: password
        }).then(()=>{
          window.location.href='index.html';
        })
        // console.log(user);
      })
      .catch((error) => {
        console.log(error);
      })
  });
}

//Tính năng đăng nhập
const formLogin = document.querySelector('#form-login');
if (formLogin){
  formLogin.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = e.target.email.value;
    const password = e.target.password.value;

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        // console.log(user);
        window.location.href='index.html';
      })
      .catch((error) => {
        if (error){
          alert('Tài khoản hoặc mật khẩu không chính xác!');
          console.log(error);
        }
      })
  });
}

//Tính năng đăng xuất
const buttonLogout = document.querySelector('[button-logout]');
if (buttonLogout){
  buttonLogout.addEventListener('click', () => {
    signOut(auth).then(() => {
      console.log('Đăng xuất thành công');
      window.location.href='login.html';
    })
    .catch((error) => {
      if (error){
        alert('Lỗi đăng xuất');
        console.log(error);
      }
    })
  })
}

//Kiểm tra trạng thái đã đăng nhập hay chưa

const chat = document.querySelector('.chat');
const buttonLogin = document.querySelector('[button-login]');
const buttonRegister = document.querySelector('[button-register]');

onAuthStateChanged(auth, (user) => {
  if (user){
    const uid = user.uid;
    buttonLogout.style.display = 'inline-block';
    chat.style.display = 'block'; 
  }
  else{
    buttonLogin.style.display = 'inline-block';
    buttonRegister.style.display = 'inline-block';
    if (chat){
      chat.innerHTML = '';
    }
    console.log('Chưa đăng nhập');
  }
})

//Chat cơ bản (Gửi tin nhắn)
const formChat = document.querySelector('.chat .inner-form');
if (formChat){
  // Upload Image
  const upload = new FileUploadWithPreview.FileUploadWithPreview('upload-image', {
    multiple: true,
    maxFileCount: 6
  });
  

  formChat.addEventListener('submit', async (e) => { 
    // console.log('hello');
    e.preventDefault();

    const userId = auth.currentUser.uid;
    const content = e.target.content.value;
    const images = upload.cachedFileArray;

    const url = 'https://api.cloudinary.com/v1_1/dixo9ts0g/image/upload';
    const formData = new FormData();  

    const imagesCloud = [];

    for (let i = 0; i < images.length; i++){
      let file = images[i];
      formData.append('file', file);
      formData.append('upload_preset', 'ycibxevd');

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json();
      imagesCloud.push(data.url);
    }

    // console.log(imagesCloud);
 
    if (userId && (content || images.length > 0)){
      push(ref(db, 'chats/'), {
        content: content,
        userId: userId,
        images: imagesCloud
      })
      e.target.content.value = '';
      upload.resetPreviewPanel();
    }
  });
}

//Xoá tin nhắn
const buttonDeleteChat = (key) => {
  const buttonDelete = document.querySelector(`[button-delete=${key}]`);
  buttonDelete.addEventListener('click', () => {
    remove(ref(db, 'chats/' + key));
  })
}

//Lắng nghe sự kiện khi một tin nhắn được xoá
onChildRemoved(ref(db, 'chats'), (data) => {
  const key = data.key;
  const elementDelete = document.querySelector(`[chat-key=${key}`);
  bodyChat.removeChild(elementDelete);
});

//Lấy ra danh sách tin nhắn
const bodyChat = document.querySelector('.chat .inner-body');

if (bodyChat){
  onChildAdded(ref(db, 'chats'), (dataChat) => {
    const key = dataChat.key;
    const userId = dataChat.val().userId;
    const content = dataChat.val().content;
    const images = dataChat.val().images;

    const dbRef = ref(getDatabase());
    get(child(dbRef, `users/${userId}`)).then((snapshot) => {
      if (snapshot.exists()) {
        // console.log(snapshot.val());
        const fullName = snapshot.val().fullName; 

        const elementChat = document.createElement('div');
        elementChat.setAttribute('chat-key', key);

        let stringFullName = '';
        let stringButtonDelete = '';
        let stringImages = '';
        let stringContent = '';

        // console.log(images);

        if (images){
          stringImages += 
          `
          <div class='inner-images'>
          `

          for (const image of images){
            stringImages += 
            `
              <img src="${image}"/>
            `
          }
          
          stringImages += 
          `
          </div>
          `
        }

        if (content){
          stringContent =
          `
            <div class='inner-content'>
              ${content}
            </div>
          `
        }

        if (userId == auth.currentUser.uid){
          elementChat.classList.add('inner-outgoing');
          stringButtonDelete=
          `
          <button class='button-delete' button-delete=${key}>
            <i class="fa-regular fa-trash-can"></i>
          </button>
          `
        } 
        else{
          elementChat.classList.add('inner-incoming');
          stringFullName =
          `
          <div class='inner-name'>
            ${fullName}
          </div>
          `
        }
        elementChat.innerHTML =
          `
          ${stringFullName}
          ${stringContent}
          ${stringImages}
          ${stringButtonDelete}
          `
        bodyChat.appendChild(elementChat);
        
        //Xoá tin nhắn
        if (userId == auth.currentUser.uid){
          buttonDeleteChat(key);
        }

        //Xem hình ảnh
        const viewer = new Viewer(elementChat);

      }
    }).catch((error) => {
      console.error(error);
    });

    // onValue(ref(db, 'users/' + userId) , (snapshot) => {
      
    // })
  })
}

//Chèn icon
const emojiPicker = document.querySelector('emoji-picker');
if(emojiPicker){
  const inputChat = document.querySelector(".chat .inner-form input[name='content']");
  emojiPicker.addEventListener('emoji-click', (event) => {
    // console.log(event.detail.unicode);
    inputChat.value += event.detail.unicode;
  });
}

//Hiển thị tooltip
const buttonIcon = document.querySelector('.button-icon');
if(buttonIcon){
  const tooltip = document.querySelector('.tooltip');
  Popper.createPopper(buttonIcon, tooltip);

  buttonIcon.addEventListener('click', () => {
    tooltip.classList.toggle('shown');
  })
}



  
