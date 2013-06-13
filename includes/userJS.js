// TODO
// * when user change indication mode, refresh style for wordBox
// * add color settings
// * add fade out delay
// * refactor code and publish next version
//
// ok: make option for info: upper box or hint
// ok: make wordBox not go over window space
//

var kpluszcz_Wc = function() {
    var that = {};

    // private
    var displayIndex = 0;
    var selection = "";
    var wordBox;

    var INFO_TIP = "tooltip";
    var INFO_BAR = "bar";
    var INFO_NONE = "none";

    var baseHintStyle = {
        background : "#f6ffb9",
        borderBottom: "",
        borderLeft: "",
        borderRight: "",
        borderTop: "",
        bottom: "",
        display : "hidden",
        fontSize: "12px",
        OTransitionDuration : "0.5s",
        OTransitionProperty : "opacity",
        OTransitionTimingFunction : "ease",
        padding : "3px",
        position : "fixed",
        zIndex : "9999",
        left: "",
        right: "",
        top: ""
    };

    var tooltipStyle = {
        borderRadius : "3px",
        border: "1px solid #63674a"
    };

    var barStyle = {
        borderTopLeftRadius: "0",
        borderTopRightRadius: "0",
        borderBottomLeftRadius: "3px",
        borderBottomRightRadius: "3px",
        borderTop: "0px",
        borderBottom: "1px solid #63674a",
        borderLeft: "1px solid #63674a",
        borderRight: "1px solid #63674a"
    };

    var displayWords = function(event) {
        var sel = document.getSelection().toString();
        var count;

        if (sel !== "") {
            if (displayIndex == 10 || sel != selection) {
                if (wordBox.style.display == "hidden") {
                    wordBox.style.display = "block";
                }
                count = countWords(sel);
                opera.extension.postMessage({
                    to: "background",
                    from: "injected",
                    action: "countResults",
                    data: count
                });

                // fill hint box
                wordBox.innerHTML = count.words + " words, " + count.letters + " letters";
                selection = sel;

                displayIndex = 0;
            } else {
                displayIndex++;
            }

            if (widget.preferences.indicationForm === INFO_TIP) {
                if (event.clientY + 30 + wordBox.clientHeight > window.innerHeight) {
                    wordBox.style.top = (window.innerHeight - wordBox.clientHeight) + "px";
                } else {
                    wordBox.style.top = (event.clientY + 30) + "px";
                }

                if (event.clientX + 30 + wordBox.clientWidth > window.innerWidth) {
                    wordBox.style.left = (window.innerWidth - wordBox.clientWidth) + "px";
                } else {
                    wordBox.style.left = (event.clientX + 30) + "px";
                }
            } else if (widget.preferences.indicationForm === INFO_BAR) {
                wordBox.style.top = 0 + "px";
                wordBox.style.right = 0 + "px";
            }
        }

    };

    var countWords = function(str) {
        var clarifiedStr = str.replace(/\n/g, " ");
        var lettersCount = clarifiedStr.replace(/ /g, "").length;
        var arrayOfWords = clarifiedStr.split(" ");

        // clean array from empty strings
        var i=0;
        while(i < arrayOfWords.length) {
            if (arrayOfWords[i] === '') {
                arrayOfWords.splice(i, 1);
            } else {
                // if not empty element, go on searching
                i += 1;
            }
        }

        return { words: arrayOfWords.length, letters: lettersCount };
    };

    var loadStyle = function(style) {
        var option;
        for(option in style) {
            if(style.hasOwnProperty(option)) {
                wordBox.style[option] = style[option];
            }
        }

    };

    var loadBaseStyle = function() {
        loadStyle(baseHintStyle);
    };

    //public
    that.name = "word counter";
    that.indicationForm = ""; // tooltip|bar|none

    that.loadBarStyle = function() {
        loadBaseStyle();
        loadStyle(barStyle);
    };

    that.loadTooltipStyle = function() {
        loadBaseStyle();
        loadStyle(tooltipStyle);
    };

    that.mouseDownHandler = function(event) {
        document.addEventListener("mouseMove", displayWords, false);
        if (widget.preferences.indicationForm !== INFO_NONE) {
            wordBox.style.opacity = 1;
        }
    };

    that.clearDisplaying = function(event) {
        document.removeEventListener("mouseMove", displayWords, false);
        if (widget.preferences.indicationForm !== INFO_NONE) {
            wordBox.style.opacity = 0;
        }
    };

    that.mouseUpHandler = function(event) {
        var selectedText = window.getSelection().toString();

        // jest zaznaczenie 
        if (selectedText !== '') {
            opera.extension.postMessage({
                to: "background",
                from: "injected",
                action: "countResults",
                data: countWords(selectedText)
            });
        }
    };

    that.init = function(event) {
        var style;
        var infoForm = widget.preferences.indicationForm;
        var option;

        wordBox = document.createElement("div");
        // :)
        wordBox.id = "dupa";

        if (typeof wordBox.style === "undefined") {
            window.setTimeout(that.init, 500);
            return;
        }

        if (infoForm === INFO_TIP) {
            that.loadTooltipStyle();
        } else if (infoForm === INFO_BAR) {
            that.loadBarStyle();
        } else { style = null; }

        document.body.appendChild(wordBox);

    };

    return that;
};

var kpluszcz_wc = kpluszcz_Wc(); 

window.addEventListener("DOMContentLoaded", function(event) {
    kpluszcz_wc.init(event);

    // show hints
    document.addEventListener("mouseDown", kpluszcz_wc.mouseDownHandler, false);
    document.addEventListener("mouseUp", kpluszcz_wc.clearDisplaying, false);
}, false);

opera.extension.onmessage = function(event) {
    var message = event.data;

    if (message.to === "injectedScript") {
        if( message.action === 'callBarStyle') {
            kpluszcz_wc.loadBarStyle();
        } else if (message.action === 'callTooltipStyle') {
            kpluszcz_wc.loadTooltipStyle();
        }
    }
};
