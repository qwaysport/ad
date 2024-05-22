var playerInstance = jwplayer("player");
playerInstance.setup({
playlist: [{
"title": "",
"sources": [
{
  "default": false,
  "type": "dash",
  "file": 'https://d25tgymtnqzu8s.cloudfront.net/smil:tv1/manifest.mpd',
                    "drm": {
                        "clearkey": { "keyId": "d84c325f36814f39bbe59080272b10c3", "key": "550727de4c96ef1ecff874905493580f" }
  },
  "label": "0"
}
]
}],
width: "100%",
height: "100%",
aspectratio: "16:12",
autostart: true,
logo: {
file: '',
link: '',
position: 'top-right'
},
cast:{},

});
