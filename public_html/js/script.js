/* navigation bar on mobile device */
const bar = document.getElementById('bar');
const close = document.getElementById('close');
const nav = document.getElementById('navbar');

if (bar) {
    bar.addEventListener('click', () => {
        nav.classList.add('active');
    })
}
if (close) {
    close.addEventListener('click', () => {
        nav.classList.remove('active');
    })
}

document.addEventListener('DOMContentLoaded', () => {
    fetch('/getCartLength')
        .then(response => response.json())
        .then(cartLength => {
          document.getElementById("numItemInCart").innerText = " " + cartLength;
          document.getElementById("numItemInCart1").innerText = " " + cartLength;
        })
    
    const currentUser = localStorage.getItem('currentUser');
    const loginButton = document.getElementById('login-button');

    if (currentUser) {
        loginButton.innerHTML = `<a style="color: blue;" href="#" id="logout-button">Log Out</a>`;
        const helloMessage = document.getElementById('helloMessage');
        helloMessage.innerHTML = `<span>Hello <strong>${currentUser}</strong></span>`;
        helloMessage.style.fontSize = "20px";


        // Add event listener for logout
        document.getElementById('logout-button').addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.reload();
        });
    }
  });








