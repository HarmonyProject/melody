var videoid;
var player;

//This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Initialise the youtube player
function onYouTubeIframeAPIReady() {
    init();
    loadPlaylist();
}

function init() {
    $.getJSON("http://api.yetanother.pw:25404/playlist/currentlyplaying", function(data){
        videoid = data.videoid;
        setName(data.name);
        setAlbumArt(videoid);
        player = new YT.Player(
            'video-box',{
                height: '210',
                width: '360',
                videoId: videoid,
                playerVars : {
                    'rel' : 0,
                    'controls' : 0,
                    'autoplay' : 1,
                    'start' : data.seek,
                    'showinfo' : 0,
                    'modestbranding' : 1,
                    'iv_load_policy' : 3
                },
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange
                }
            }
        );
    });
    setInterval(loadNowPlaying, 5000);
    setInterval(loadPlaylist,3000);
    setInterval(setSeek, 1000);
}

function loadPlaylist() {
    $.getJSON("http://api.yetanother.pw:25404/playlist", function(data){
        $('.list-group-item').remove();
        if (data.length == 1) {
                $('<li class="list-group-item"><span class="badge">' + '</span>' + "Nothing in the queue now." +'</li>')
                .appendTo('.list-group');
        } else {
            for (var i = 0; i < data.length; i++) {
                $('<li class="list-group-item"><span class="badge">' + data[i].added_by + '</span>' + data[i].name +'</li>')
                .appendTo('.list-group');
            }
        }
    });
}

$('#search-form').submit(function(event) {
    event.preventDefault();
    query = $('#search-term').val();
    user = "Abhishek";
    search(query, user);
});

function setName(name) {
    $('#song-name').text(name);
}

function setAlbumArt(videoid) {
    url = "https://img.youtube.com/vi/" + videoid + "/0.jpg";
    $('#albumart').attr('src', url);
}

function setSeek() {
    seek = player.getCurrentTime();
    total = player.getDuration();
    percent = (seek * 100.0)/total;
    $('#progress-bar').css('width', percent+'%');
    $('#progress-bar').text(formatTime(seek));
}

function onPlayerReady(event) {
event.target.playVideo();
setSeek();
}

function inSync(videoid, seek) {
    var videoid_match = player.getVideoData().video_id === videoid;
    var seek_match = Math.abs(player.getCurrentTime() - seek) <= 20;
    return videoid_match && seek_match;
}

function loadNowPlaying(){
    $.getJSON("http://api.yetanother.pw:25404/playlist/currentlyplaying", function(data){
        if (inSync(data.videoid, data.seek) == false) {
            setName(data.name);
            setAlbumArt(data.videoid);
            player.loadVideoById(data.videoid, data.seek);
        }
    });
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED) {
        loadNowPlaying();
        loadPlaylist();
    }
}

function search(query, user) {
    $.ajax({
      type: "POST",
      url: "http://api.yetanother.pw:25404/add",
      crossDomain : true,
      data: {
        'q' : query,
        'user' : user
      },
      success: function(){
        $('#message').show();
        $("#message").fadeTo(2000, 500).slideUp(500, function(){$("#message").hide();});
        setTimeout(loadPlaylist, 2000);
      },
      error : function() {
        $('#message').addClass('alert-danger').removeClass('alert-success').show();
        $("#message").fadeTo(2000, 500).slideUp(500, function(){$("#message").hide();});
      }
    });
}

function formatTime(seconds, hasHours) {
    var time = [],
        s = 1;
    var calc = seconds;
    if (hasHours) {
        s = 3600;
        calc = calc / s;
        time.push(format(Math.floor(calc)));//hour
    }
    calc = ((calc - (time[time.length-1] || 0)) * s) / 60;
    time.push(format(Math.floor(calc)));//minute
    calc = (calc - (time[time.length-1])) * 60;
    time.push(format(Math.round(calc)));//second
    function format(n) {//it makes "0X"/"00"/"XX"
        return (("" + n) / 10).toFixed(1).replace(".", "");
    }
    return time.join(":");
};
