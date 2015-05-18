window.onYouTubeIframeAPIReady = function(){
    Melody.player.p = new YT.Player('player', {
          height: Melody.player.height,
          width: Melody.player.width,
          videoId: Melody.Player.videoId,
          events: {
            'onReady': Melody.events.onReady,
            'onStateChange': onPlayerStateChange
          }
    });
}

window.Melody = function (){
    return {
        player : {
            p : {}
            ,height: '0'
            ,width: '0'
            ,videoId : 'V0FotIwYhMw'
            ,controls : {
                play : function(){
                    this.player.p.playVideo();
                }, pause: function(){
                    this.player.p.pauseVideo();
                }, stop: function(){
                    this.player.p.stopVideo();
                }
            }
        },options :{
        },initYTAPI : function(){
            var tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        },events:{
            onReady: function(){

            }, onPlayerStateChange: function(){

            }
        }
    }
}()
