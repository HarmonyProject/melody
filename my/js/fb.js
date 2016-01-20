var user;

// Load the SDK asynchronously
(function(d, s, id){
 var js, fjs = d.getElementsByTagName(s)[0];
 if (d.getElementById(id)) {return;}
 js = d.createElement(s); js.id = id;
 js.src = "//connect.facebook.net/en_US/sdk.js";
 fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));


window.fbAsyncInit = function() {
FB.init({
  appId      : '902706029842457',
  xfbml      : true,
  version    : 'v2.5'
});
checkLoginState();
};

function checkLoginState() {
    FB.getLoginStatus(function(response) {
        if (response.status === 'connected') {
            $('#welcome').remove();
            $('.fb_iframe_widget').remove();
            getIdentity();
            $('#wrapper').show();
        } else {
            //$('.fb-login-button').show();
        }
    });
}

function load(){
    if (youtubeReady == true && ready == true) {
        init();
    } else {
        setTimeout(load, 1000);
    }
}

function getIdentity(){
    FB.api('/me', function(response) {
        user = response;
        getCurrentlyPlaying();
        loadLogoBox();
        load();
    });
}

