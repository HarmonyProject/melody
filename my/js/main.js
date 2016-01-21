var videoid;
var player;
var youtubeReady = false;
var YTplayerinitialised = false;
var current_song;

//This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

function onYouTubeIframeAPIReady() {
    youtubeReady = true;
}

function init(songObject) {
    if (songObject == null || songObject.videoid == null) {
        console.log("no song found to initialise player.");
        hideYTPlayer();
    } else {
        setInterval(setSeek, 1000);
        setInterval(persistPlaylist, 15000);
        player = initYTPlayer(songObject.videoid, getSeek());
        YTplayerinitialised = true;
        setName(songObject.track);
        setAlbumArt(songObject.videoid);
        current_song = songObject;
        showYTPlayer();
        updateTimestampInLibrary(songObject);
        unloadPlaylist(JSON.parse(retrievePlaylist()));
    }
}

function loadNowPlaying(songObject){
    if (songObject == null || songObject.videoid == null) {
        console.log("no song found to load into player.");
        hideYTPlayer();
    } else {
        setName(songObject.track);
        setAlbumArt(songObject.videoid);
        player.loadVideoById(songObject.videoid, 0);
        current_song = songObject;
        showYTPlayer();
        updateTimestampInLibrary(songObject);
    }
}

function hideYTPlayer() {
    if ($('#video-box').is(":visible")) $('#video-box').hide();
}

function showYTPlayer() {
    if ($('#video-box').is(":hidden")) $('#video-box').show();
}

function initYTPlayer(videoid, seek) {
    player = new YT.Player(
        'video-box',{
            height: '210',
            width: '360',
            videoId: videoid,
            playerVars : {
                'rel' : 0,
                'controls' : 1,
                'autoplay' : 1,
                'start' : seek,
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
    return player;
}

function loadLogoBox() {
    FB.api('/v2.5/' + user.id + '/picture', function(response) {
        $('#fb-avatar').attr('src', response.data.url);
    });
}

function playFirstSong() {
    song = JSON.parse(localStorage.getItem('current-song'));
    if (song != null && song.videoid != null) {
        current_song = song;
        init(current_song);
    }
    else {
        current_song = {};
        $.getJSON("http://api.yetanother.pw:25404/lastsong?userid=" + user.id, function(data){
        current_song.videoid = data.videoid;
        current_song.artist = data.artist;
        current_song.track = data.track;
        current_song.rating = data.rating;
        current_song.fav = data.fav;
        init(current_song);
        });
    }
}

function getSeek() {
    seekString = localStorage.getItem('current-seek');
    if (!seekString) return 0;
    return parseInt(seekString);
}

function addToPlaylist(songObject) {
    $('<li class = "list-group-item clearfix">'
          + '<div class = "container">'
          + '<div class = "row">'
          + '<div class = "col-sm-3 artist">'
          +      songObject.artist
          + '</div>'
          + '<div class = "col-sm-6 track">'
          +      songObject.track
          + '</div>'
          + '<div class = "col-sm-0 videoid">'
          +      songObject.videoid
          + '</div>'
          +  '<div class = "col-sm-1">'
          +      '<button type="button" class="btn btn-default library-button" id="' + songObject.videoid +'" onclick = "updateLibrary(this);">library</button>'
          + '</div>'
          + '<div class = "col-sm-1 rating">'
          +      songObject.rating
          + '</div>'
          +  '<div class = "col-sm-1 fav">'
          +      songObject.fav
          + '</div>'
          +'</div>'
          +'</div>'
          +'</li>')
    .appendTo('.list-group');
    chooseColorOfButton(songObject.videoid);
    persistPlaylist();
}

function persistPlaylist(){
    localStorage.setItem('raga-playlist', JSON.stringify(loadPlaylist()));
    if (YTplayerinitialised) localStorage.setItem('current-song', JSON.stringify(current_song));
}

function retrievePlaylist(){
    return localStorage.getItem('raga-playlist');
}

function loadPlaylist() {
    var playlist = [];
    $('.list-group-item').each(function(index){
        songObject = createSongFromListGroupItem($(this));
        playlist.push(songObject);
    });
    return playlist;
}

function createSongFromListGroupItem(listGroupItem) {
        return {
            "videoid" : $(listGroupItem).find('div.videoid').text(),
            "artist" : $(listGroupItem).find('div.artist').text(),
            "track" : $(listGroupItem).find('div.track').text(),
            "rating" : $(listGroupItem).find('div.rating').text(),
            "fav" : $(listGroupItem).find('div.fav').text()
        };
}

function unloadPlaylist(playlist) {
    $.each(playlist, function(key, value) {
        addToPlaylist(value);
    });
}

$('#search-form').submit(function(event) {
    event.preventDefault();
    query = $('#search-term').val();
    search(query, user.name);
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
    localStorage.setItem('current-seek', JSON.stringify(seek))
}

function onPlayerReady(event) {
event.target.playVideo();
setSeek();
}

function updateTimestampInLibrary(songObject) {
    uri = encodeURI("http://api.yetanother.pw:25404/library/updatelastplayed?userid="+user.id+"&videoid="+songObject.videoid);
    $.getJSON(uri, function(data){
        console.log("updated last_played value in library.");
    });
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED) {
        playNext();
    }
}

function emptyPlaylist() {
   return ($('.list-group-item').length == 0);
}

function playNext() {
    if (emptyPlaylist()) {
        uri = encodeURI("http://api.yetanother.pw:25404/library/get?userid="+user.id+"&fav=false")
        $.getJSON(uri, function(songObject){
            if (YTplayerinitialised) {
                loadNowPlaying(songObject)
            }
            else {
                init(songObject);
            }
        });
    } else {
        firstItem = $('.list-group-item').first();
        songObject = {
            "videoid" : firstItem.find('div.videoid').text(),
            "artist" : firstItem.find('div.artist').text(),
            "track" : firstItem.find('div.track').text(),
            "rating" : firstItem.find('div.rating').text(),
            "fav" : firstItem.find('div.fav').text(),
        }
        firstItem.remove();

        if (YTplayerinitialised) {
            loadNowPlaying(songObject)
        }
        else {
            init(songObject);
        }
    }
}

function search(query) {
    uri = encodeURI("http://api.yetanother.pw:25404/query?q=" + query);
    $.getJSON(uri, function(data) {
        songObject = {
            "videoid" : data[0].videoid,
            "artist" : "",
            "track" : data[0].name,
            "rating" : 0,
            "fav" : 0
        }
        addToPlaylist(songObject);
        if (player.getPlayerState() == -1 || player.getPlayerState() == 0) {
            console.log("playing searched item since playlist is empty.")
            playNext();
        }
    });
}

function chooseColorOfButton(videoid) {
    url = encodeURI("http://api.yetanother.pw:25404/library/songexists?videoid="+videoid+"&userid="+user.id);
    $.ajax({
        type : "GET",
        url : url,
        success : function(data) {
            exists = data.status;
            if (exists == true) $('#'+videoid).addClass('btn-danger').removeClass('btn-default');
        }
    });
}


function updateLibrary(button) {
    var operation;
    if ($(button).hasClass('btn-default')) {
        operation = 'add';
    } else {
        operation = 'remove';
    }
    songObject = createSongFromListGroupItem($(button).closest('li'))

    url = encodeURI("http://api.yetanother.pw:25404/library?operation="+operation+"&username="+user.name+"&userid="+user.id+"&songtrack="+songObject.track+"&songartist="+songObject.artist+"&songrating="+songObject.rating+"&songfav="+songObject.fav+"&songvideoid="+songObject.videoid);
    $.ajax({
        type : "GET",
        url : url,
        statusCode : {
            200 : function(){
                if (operation == "add") $(button).addClass('btn-danger').removeClass('btn-default');
                if (operation == "remove") $(button).addClass('btn-default').removeClass('btn-danger');
            },
            400 : function() {
                    ("unable to update library");
            }
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