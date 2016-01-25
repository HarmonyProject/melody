var videoid;
var player;
var youtubeReady = false;
var YTplayerinitialised = false;
var current_song;
var id = 0;
//This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

function hashId() {
    function S4() {
        return (((1 + Math.random()) * 0x10000) | 0)
            .toString(16)
            .substring(1);
    }
    return (S4() + S4() + "-" + S4() + "-4" + S4()
            .substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4())
        .toLowerCase();
}

function onYouTubeIframeAPIReady() {
    youtubeReady = true;
}

function init(songObject) {
    if (songObject == null || songObject.videoid == null) {
        console.log("no song found to initialise player.");
        hideYTPlayer();
    } else {
        current_song = songObject;
        setInterval(setSeek, 1000);
        setInterval(persistPlaylist, 5000);
        player = initYTPlayer(songObject.videoid, getSeek());
        YTplayerinitialised = true;
        setName(songObject.track);
        setAlbumArt(songObject.videoid);
        showYTPlayer();
        updateTimestampInLibrary(songObject);
        unloadPlaylist(JSON.parse(retrievePlaylist()));
        highlightCurrentlyPlayingSongInPlaylist();
    }
}

function loadNowPlaying(songObject) {
    if (songObject == null || songObject.videoid == null) {
        console.log("no song found to load into player.");
        hideYTPlayer();
    } else {
        current_song = songObject;
        setName(songObject.track);
        setAlbumArt(songObject.videoid);
        player.cueVideoById(songObject.videoid, 0);
        updateTimestampInLibrary(songObject);
        highlightCurrentlyPlayingSongInPlaylist();
        if (is_playing()) player.playVideo();
        showYTPlayer();
        enqueueInRadio(current_song.track, user.name);
    }
}

function enqueueInRadio(query, user) {
    $.ajax({
        type: "POST",
        url: "http://api.yetanother.pw:25404/add",
        crossDomain: true,
        data: {
            'q': query,
            'user': user
        },
        success: function() {},
        error: function() {
            console.log("error in adding this to raga radio");
        }
    });
}

function currentPlaylistEntry() {
    identifier = 'li[data-hashid=\'' + current_song.hashid + '\']';
    return $(identifier);
}

function highlightCurrentlyPlayingSongInPlaylist() {
    $('.list-group-item')
        .css({
            'background': ''
        });
    currentPlaylistEntry()
        .css({
            'background': '#DAE6F0'
        });
}

function hideYTPlayer() {
    if ($('#video-box')
        .is(":visible")) $('#video-box')
        .hide();
}

function showYTPlayer() {
    if ($('#video-box')
        .is(":hidden")) $('#video-box')
        .show();
}

function initYTPlayer(videoid, seek) {
    player = new YT.Player('video-box', {
        height: '210',
        width: '360',
        videoId: videoid,
        playerVars: {
            'rel': 0,
            'controls': 1,
            'autoplay': 0,
            'start': seek,
            'showinfo': 0,
            'modestbranding': 1,
            'iv_load_policy': 3
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
    return player;
}

function loadLogoBox() {
    FB.api('/v2.5/' + user.id + '/picture', function(response) {
        $('#fb-avatar')
            .attr('src', response.data.url);
    });
}

function playFirstSong() {
    song = JSON.parse(localStorage.getItem('current-song'));
    if (song != null && song.videoid != null) {
        current_song = song;
        init(current_song);
    } else {
        current_song = {};
        $.getJSON("http://api.yetanother.pw:25404/lastsong?userid=" + user.id, function(data) {
            current_song.videoid = data.videoid;
            current_song.artist = data.artist;
            current_song.track = data.track;
            current_song.rating = data.rating;
            current_song.fav = data.fav;
            current_song.hashid = hashId();
            addToPlaylist(current_song);
            persistPlaylist();
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
    $('<li class = "list-group-item clearfix" id="li-' + songObject.videoid + '" data-hashid="' + songObject.hashid + '">' 
        + '<p class = "col-sm-8 track" onclick = "playOnTrackClick(this)">' + songObject.track + '</p>' 
        + '<p class = "col-sm-0 videoid">' + songObject.videoid + '</p>' 
        + '<button type="button" class="glyphicon col-sm-1" id="button-' + songObject.videoid + '" onclick = "updateLibrary(this);"></button>' 
        + '<span class = "col-sm-2 star-rating">' 
        +  '<input type="radio" name="rating" value="1"><i></i>'
        +  '<input type="radio" name="rating" value="2"><i></i>'
        +  '<input type="radio" name="rating" value="3"><i></i>'
        +  '<input type="radio" name="rating" value="4"><i></i>'
        +  '<input type="radio" name="rating" value="5"><i></i>'
        + '</span>' 
        + '<div class = "col-sm-1">' + '<button type="button" class="close" onclick = "removeFromPlaylist(this);">&times;</button> </div>' 
        + '</li>')
        .appendTo('.list-group');
    chooseColorOfButton(songObject.videoid);
    persistPlaylist();
}

function persistPlaylist() {
    localStorage.setItem('raga-playlist', JSON.stringify(loadPlaylist()));
    if (YTplayerinitialised) localStorage.setItem('current-song', JSON.stringify(current_song));
}

function retrievePlaylist() {
    return localStorage.getItem('raga-playlist');
}

function loadPlaylist() {
    var playlist = [];
    $('.list-group-item')
        .each(function(index) {
            songObject = createSongFromListGroupItem($(this));
            playlist.push(songObject);
        });
    return playlist;
}

function createSongFromListGroupItem(listGroupItem) {
    return {
        "videoid": $(listGroupItem)
            .find('p.videoid')
            .text(),
        "artist": $(listGroupItem)
            .find('p.artist')
            .text(),
        "track": $(listGroupItem)
            .find('p.track')
            .text(),
        "rating": $(listGroupItem)
            .find('p.rating')
            .text(),
        "fav": $(listGroupItem)
            .find('p.fav')
            .text(),
        "hashid": $(listGroupItem)
            .attr('data-hashid')
    };
}

function unloadPlaylist(playlist) {
    $('list-group-item')
        .remove();
    $.each(playlist, function(key, value) {
        addToPlaylist(value);
    });
}

function setName(name) {
    $('#song-name')
        .text(name);
}

function setAlbumArt(videoid) {
    url = "https://img.youtube.com/vi/" + videoid + "/0.jpg";
    $('#albumart')
        .attr('src', url);
}

function setSeek() {
    seek = player.getCurrentTime();
    total = player.getDuration();
    percent = (seek * 100.0) / total;
    $('#progress-bar')
        .css('width', percent + '%');
    $('#timer')
        .text(formatTime(seek) + "/" + formatTime(total));
    localStorage.setItem('current-seek', JSON.stringify(seek))
}

function onPlayerReady(event) {
    setSeek();
}

function updateTimestampInLibrary(songObject) {
    uri = encodeURI("http://api.yetanother.pw:25404/library/updatelastplayed?userid=" + user.id + "&videoid=" + songObject.videoid);
    $.getJSON(uri, function(data) {
    });
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED) {
        trimPlaylist();
        playNext();
    }
}

// trim the starting items of the playlist if it starts increasing beyond 50 elements
function trimPlaylist() {
    extra = $('.list-group-item').length; - 10 - 1;
    if (extra >= 0) $('.list-group-item:lt(' + extra + ')')
        .remove();
}

function emptyPlaylist() {
    return ($('.list-group-item')
        .length == 0);
}

function playPrev(){
    if ($('.list-group-item').first().attr('data-hashid') != currentPlaylistEntry().attr('data-hashid'))
        loadNowPlaying(createSongFromListGroupItem($(currentPlaylistEntry()).prev()));
}

function playNext() {
    if (emptyPlaylist()) {
        playSongFromLibrary();
    } else {
        if (currentlyPlayingIsLast()) {
            playSongFromLibrary()
        } else {
            playSongFromPlaylist()
        }
    }

    function playSongFromLibrary() {
        uri = encodeURI("http://api.yetanother.pw:25404/library/get?userid=" + user.id + "&fav=false")
        $.getJSON(uri, function(songObject) {
            // if there is no song to play from library, collapse player
            if (songObject.videoid == "") {
                hideYTPlayer();
            } else {
                songObject.hashid = hashId();
                addToPlaylist(songObject);
                if (YTplayerinitialised) {
                    loadNowPlaying(songObject)
                } else {
                    init(songObject);
                }
            }
        });
    }

    function playSongFromPlaylist() {
        nextItem = currentPlaylistEntry()
            .next();
        songObject = createSongFromListGroupItem(nextItem);
        if (YTplayerinitialised) {
            loadNowPlaying(songObject)
        } else {
            init(songObject);
        }
    }
}

function currentlyPlayingIsLast() {
    return ($('.list-group-item')
        .last()
        .attr('data-hashid') == current_song.hashid);
}

function search(query) {
    uri = encodeURI("http://api.yetanother.pw:25404/query?q=" + query);
    $.getJSON(uri, function(data) {
        songObject = {
            "videoid": data[0].videoid,
            "artist": "",
            "track": data[0].name,
            "rating": 0,
            "fav": 0,
            "hashid": hashId()
        }
        addToPlaylist(songObject);
        if (player.getPlayerState() == -1 || player.getPlayerState() == 0) {
            console.log("playing searched item since playlist is empty.")
            if (YTplayerinitialised) {
                loadNowPlaying(songObject)
            } else {
                init(songObject);
            }
        }
    });
}

function chooseColorOfButton(videoid) {
    url = encodeURI("http://api.yetanother.pw:25404/library/songexists?videoid=" + videoid + "&userid=" + user.id);
    $.ajax({
        type: "GET",
        url: url,
        success: function(data) {
            exists = data.status;
            if (exists == true) {
                $(":button")
                    .filter('#button-' + videoid)
                    .addClass('glyphicon-heart');
            } else {
                $(":button")
                    .filter('#button-' + videoid)
                    .addClass('glyphicon-heart-empty');
            }
        }
    });
}

function updateLibrary(button) {
    var operation;
    if ($(button)
        .hasClass('glyphicon-heart-empty')) {
        operation = 'add';
    } else {
        operation = 'remove';
    }
    songObject = createSongFromListGroupItem($(button)
        .closest('li'))
    url = encodeURI("http://api.yetanother.pw:25404/library?operation=" + operation + "&username=" + user.name + "&userid=" + user.id + "&songtrack=" + songObject.track + "&songartist=" + songObject.artist + "&songrating=" + songObject.rating + "&songfav=" + songObject.fav + "&songvideoid=" + songObject.videoid);
    $.ajax({
        type: "GET",
        url: url,
        statusCode: {
            200: function() {
                if (operation == "add") $(button)
                    .addClass('glyphicon-heart')
                    .removeClass('glyphicon-heart-empty');
                if (operation == "remove") $(button)
                    .addClass('glyphicon-heart-empty')
                    .removeClass('glyphicon-heart');
            },
            400: function() {
                ("unable to update library");
            }
        }
    });
}

function removeFromPlaylist(button) {
    playlist_entry = $(button)
        .closest('li');
    was_currently_playing = playlist_entry.attr('data-hashid') == current_song.hashid;
    if (was_currently_playing) playNext();
    playlist_entry.remove();
}

function play() {
    icon = $('#play-toggle').find('i');
    if (icon.hasClass('glyphicon-play')) {
        icon.addClass('glyphicon-pause')
            .removeClass('glyphicon-play');
        player.playVideo();
        $('#equalizer-gif')
            .show();
    }
}

function pause() {
    icon = $('#play-toggle').find('i');
    if (icon.hasClass('glyphicon-pause')) {
        icon.addClass('glyphicon-play')
            .removeClass('glyphicon-pause');
        player.pauseVideo();
        $('#equalizer-gif')
            .hide();
    }
}

function is_playing() {
    icon = $('#play-toggle').find('i');
    if (icon.hasClass('glyphicon-pause')) return true;
    else if (icon.hasClass('glyphicon-play')) return false;
}

function playToggle(button) {
    if (is_playing()) pause();
    else play();
}

function events() {
    $('#search-form')
        .submit(function(event) {
            event.preventDefault();
            query = $('#search-term')
                .val();
            search(query, user.name);
        });
    $('.progress')
        .click(function() {
            console.log('wow!');
        });
    $(':radio')
        .change(function() {
            $('.choice').text( this.value + ' stars' );
        });
}

function playOnTrackClick(button) {
    songObject = createSongFromListGroupItem(button.closest('li'));
    loadNowPlaying(songObject);    
}

function formatTime(seconds, hasHours) {
    var time = [],
        s = 1;
    var calc = seconds;
    if (hasHours) {
        s = 3600;
        calc = calc / s;
        time.push(format(Math.floor(calc))); //hour
    }
    calc = ((calc - (time[time.length - 1] || 0)) * s) / 60;
    time.push(format(Math.floor(calc))); //minute
    calc = (calc - (time[time.length - 1])) * 60;
    time.push(format(Math.round(calc))); //second
    function format(n) { //it makes "0X"/"00"/"XX"
        return (("" + n) / 10)
            .toFixed(1)
            .replace(".", "");
    }
    return time.join(":");
};