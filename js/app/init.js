window.getParameterByName = function(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}
window.onYouTubeIframeAPIReady = function(){
    if(getParameterByName("mode") !== undefined && getParameterByName("mode") != "client" ){
        Melody.player.p = new YT.Player('player', {
              height: Melody.player.height,
              width: Melody.player.width,
              videoId: Melody.player.videoId,
              events : Melody.events
        });
    }
}
Handlebars.registerHelper('userCheck', function(value) {
    //<span class=\"label label-success pull-right\">{{userCheck added_by}}</span>
    if (value == "system"){
        return new Handlebars.SafeString(
            "<span class=\"label label-warning pull-right\">"+
            value+"</span>"
        )
    }
    return new Handlebars.SafeString(
        "<span class=\"label label-success pull-right\">"+
        value+"</span>"
    )
});
window.Melody = function (){
    return {
        api: "http://api.yetanother.pw/"
        ,player : {
            p : {}
            ,height: '0'
            ,width: '0'
            ,videoId : ''
            ,seek: 0
            ,len: 0
            ,nm: ""
            ,user : ""
            ,controls : {
                play : function(){
                    Melody.player.p.playVideo();
                }, pause: function(){
                    Melody.player.p.pauseVideo();
                }, stop: function(){
                    Melody.player.p.stopVideo();
                }
            }
        },tag: {}
        ,options :{
            title : "#song-title"
            ,time : "#song-time"
            ,playlist: "#playlist-container"
            ,add: "#add-input"
            ,user: "#add-user"
        },getyt: function(){
            this.tag = document.createElement('script');
            this.tag.src = "https://www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(this.tag, firstScriptTag);
        },events:{
            'onReady': function(event){
                console.log(event);
                var player = event.target;
                setInterval(function(){
                    var min = Math.floor(player.getCurrentTime()/60);
                    var sec = Math.floor(player.getCurrentTime()%60);
                    var fullmin = Math.floor(Melody.player.len/60);
                    var fullsec = Math.floor(Melody.player.len%60);
                    $(Melody.options.time).text((min == 0 ? "00" : (min <= 9 ? "0"+min:min)) +":"
                    + (sec <= 9 ? "0"+sec : sec) + " / " +
                    (fullmin == 0 ? "00" : (fullmin <= 9 ? "0"+fullmin:fullmin)) +":"
                    + (fullsec <= 9 ? "0"+fullsec : fullsec));
                },1000)
                player.playVideo();
            },'onStateChange': function(event){
                console.log(event);
                var player = event.target;
                if(event.data === 0) {
                    Melody.currentlyPlaying();
                }
            }
        },bind: function(){
            $(Melody.options.add).keyup(function(e){
                e.preventDefault();
                if(e.keyCode == 13){
                    Melody.addSong();
                }
            })
            $(Melody.options.user).keyup(function(e){
                e.preventDefault();
                if(e.keyCode == 13){
                    Melody.addUser();
                }
            })
            return this;
        },init: function(){
            // return this;
            // this.bind();
            if (this.checkUser()){
                this.getyt();
                this.currentlyPlaying();
                this.getPlaylist();
                setInterval(function(){Melody.getPlaylist();},30000)
                setInterval(function(){Melody.currentlyPlaying();},10000)
            }
        },checkUser: function(){
            var user = this.getCookie("Melody.user")
            if (user == ""){
                this.promptModal()
                return false
            }
            this.player.user = user;
            return true
        },promptModal: function(){
            $('#userModal').modal('show')
        },hideModal: function(){
            $('#userModal').modal('hide')
        },addUser: function(){
            var user = $(Melody.options.user).val();
            this.setCookie("Melody.user", user,180)
            this.player.user = user;
            this.init();
            this.hideModal();
        },currentlyPlaying:function(){
            $.getJSON(this.api + "playlist/currentlyplaying",function(data){
                if (data["seek"] >= 0 ){
                    if (Melody.player.videoId != data["videoid"]){
                        Melody.player.videoId = data["videoid"]
                        Melody.player.seek = data["seek"]
                        Melody.player.len = data["length"]
                        Melody.player.nm = data["name"]
                        $(Melody.options.title).text(Melody.player.nm)
                        Melody.whenSeekAvailable("seekTo", function(){
                            if(getParameterByName("mode") !== undefined && getParameterByName("mode") != "client" ){
                                Melody.player.p.cueVideoById(Melody.player.videoId);
                                Melody.player.p.seekTo(Melody.player.seek);
                                $(Melody.options.title).text(Melody.player.nm)
                                Melody.getPlaylist();
                            }
                        })
                    }
                }else{
                    var sl = -1 * data["seek"];
                    setTimeout(function(){
                        Melody.currentlyPlaying();
                    },sl * 1000)
                }
            })
        },whenSeekAvailable : function(name, callback) {
            var interval = 10; // ms
            window.setTimeout(function() {
                if (Melody.player.p[name]) {
                    callback(Melody.player.p[name]);
                } else {
                    window.setTimeout(arguments.callee, interval);
                }
            }, interval);
        },getPlaylist:function(){
            $.getJSON(this.api + "playlist", function(data){
                var compiledPlaylistTpl = Handlebars.compile(Melody.handlebars.playlist);
                $(Melody.options.playlist).html(compiledPlaylistTpl({playlist:data}))
            })
        },addSong:function(){
            var data = {"q":$(Melody.options.add).val(), "user":this.player.user}
            $.post( this.api + "add", data).done(function(){
                $("#song-add-success-content").text("Song Successfully Added!")
                $("#song-add-success").show();
                $(Melody.options.add).val("")
                setTimeout(function(){
                    $("#song-add-success").hide();
                },5000)
                Melody.getPlaylist();
            }).fail(function(){
                $("#song-add-error-content").text("Error adding song")
                $("#song-add-error").show();
                setTimeout(function(){
                    $("#song-add-error").hide();
                },5000)
            })
        },handlebars:{
            playlist : "{{#each playlist}}"
                +"<a href=\"javascript:void(0);\" class=\"list-group-item\">"
                +"{{this.name}}"
                +"{{{userCheck this.added_by}}}"
                +"</a>"
                +"{{/each}}"
        }, getCookie: function(cname) {
            var name = cname + "=";
            var ca = document.cookie.split(';');
            for(var i=0; i<ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0)==' ') c = c.substring(1);
                if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
            }
            return "";
        }, setCookie: function(cname, cvalue, exdays){
            var d = new Date();
            d.setTime(d.getTime() + (exdays*24*60*60*1000));
            var expires = "expires="+d.toUTCString();
            document.cookie = cname + "=" + cvalue + "; " + expires;
        }
    }
}()
