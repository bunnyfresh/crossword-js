/**
 * Author: Sergey Gudzenko
 * GitHub: https://github.com/bunnyfresh
 * Repository: https://github.com/bunnyfresh/crossword-js
 * Instagram: https://www.instagram.com/gudziboy/
 */

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

ctx.lineWidth = 1;
// ctx.font = 'bold 35px serif';
ctx.font = 'bold 25px serif';

// Pull of words
const words = [
    "established",
    "reader",
    "distracted",
    "content",
    "looking",
    "point",
    "normal",
    "opposed"
]
// Crossword size
const rowCount = 15;
const columnCount = 15;

var globalCount = 0;
var showWords = false;
var wordArr = words,
    wordBank, wordsActive = [];

var Bounds = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,

    Update: function (x, y) {
        this.top = Math.min(y, this.top);
        this.right = Math.max(x, this.right);
        this.bottom = Math.max(y, this.bottom);
        this.left = Math.min(x, this.left);
    },

    Clean: function () {
        this.top = 999;
        this.right = 0;
        this.bottom = 0;
        this.left = 999;
    }
};

// pull of words
const wordsPull = [];

// switcher direction
let changeDirection = true;

// crossword area init
let crosswordArea = new Array(rowCount);
for (var i = 0; i < crosswordArea.length; i++) {
    crosswordArea[i] = new Array(columnCount).fill(null);
}

// find long word
words.sort((a, b) => b.length - a.length);

// render function
const renderCrossWord = (s = false) => {
    for (let x = 0; x < crosswordArea.length; x++) {
        for (let y = 0; y < crosswordArea[x].length; y++) {
            if (crosswordArea[x][y]) {
                if (s) {
                    ctx.fillText(crosswordArea[x][y], 50 + 5 + (50 * y), (50 + 20 + (50 * x)));
                } else {
                    if (Number.isInteger(parseInt(crosswordArea[x][y]))) {
                        ctx.fillText(crosswordArea[x][y], 50 + 5 + (50 * y), (50 + 20 + (50 * x)));
                    }
                }

                ctx.beginPath();
                ctx.rect(50 + (50 * y), (50 + (50 * x)), 50, 50);
                ctx.stroke();

            }

        }
    }
}

const clearCanvas = () => new Promise((_r, _d) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    Bounds.Clean();

    globalCount = 0;

    wordBank = [];
    wordsActive = [];
    crosswordArea = [];

    crosswordArea = new Array(rowCount);
    for (var i = 0; i < crosswordArea.length; i++) {
        crosswordArea[i] = new Array(columnCount).fill(null);
    }


    setTimeout(() => {
        _r(true);
    }, 300)
})




function PopulateBoard(s = false) {
    clearCanvas().then(_ => {
        PrepareBoard();

        for (var i = 0, isOk = true, len = wordBank.length; i < len && isOk; i++) {
            isOk = AddWordToBoard(s);
        }
        return isOk;
    })
}


function PrepareBoard() {
    wordBank = [];

    for (var i = 0, len = wordArr.length; i < len; i++) {
        wordBank.push(new WordObj(wordArr[i]));
    }

    for (i = 0; i < wordBank.length; i++) {
        for (var j = 0, wA = wordBank[i]; j < wA.char.length; j++) {
            for (var k = 0, cA = wA.char[j]; k < wordBank.length; k++) {
                for (var l = 0, wB = wordBank[k]; k !== i && l < wB.char.length; l++) {
                    wA.totalMatches += (cA === wB.char[l]) ? 1 : 0;
                }
            }
        }
    }
}

function AddWordToBoard(s = false) {
    var i, len, curIndex, curWord, curChar, curMatch, testWord, testChar,
        minMatchDiff = 9999,
        curMatchDiff;


    if (wordsActive.length < 1) {
        curIndex = 0;
        for (i = 0, len = wordBank.length; i < len; i++) {
            if (wordBank[i].totalMatches < wordBank[curIndex].totalMatches) {
                curIndex = i;
            }
        }
        wordBank[curIndex].successfulMatches = [{
            x: 7,
            y: 3,
            dir: 0
        }];
    } else {
        curIndex = -1;

        for (i = 0, len = wordBank.length; i < len; i++) {
            curWord = wordBank[i];
            curWord.effectiveMatches = 0;
            curWord.successfulMatches = [];
            for (var j = 0, lenJ = curWord.char.length; j < lenJ; j++) {
                curChar = curWord.char[j];
                for (var k = 0, lenK = wordsActive.length; k < lenK; k++) {
                    testWord = wordsActive[k];
                    for (var l = 0, lenL = testWord.char.length; l < lenL; l++) {
                        testChar = testWord.char[l];
                        if (curChar === testChar) {
                            curWord.effectiveMatches++;

                            var curCross = {
                                x: testWord.x,
                                y: testWord.y,
                                dir: 0
                            };
                            if (testWord.dir === 0) {
                                curCross.dir = 1;
                                curCross.x += l;
                                curCross.y -= j;
                            } else {
                                curCross.dir = 0;
                                curCross.y += l;
                                curCross.x -= j;
                            }

                            var isMatch = true;

                            for (var m = -1, lenM = curWord.char.length + 1; m < lenM; m++) {
                                var crossVal = [];
                                if (m !== j) {
                                    if (curCross.dir === 0) {
                                        var xIndex = curCross.x + m;

                                        if (xIndex < 0 || xIndex > crosswordArea.length) {
                                            isMatch = false;
                                            break;
                                        }
                                        if (crosswordArea[xIndex]) {
                                            crossVal.push(crosswordArea[xIndex][curCross.y]);
                                            crossVal.push(crosswordArea[xIndex][curCross.y + 1]);
                                            crossVal.push(crosswordArea[xIndex][curCross.y - 1]);
                                        }

                                    } else {
                                        var yIndex = curCross.y + m;

                                        if (yIndex < 0 || yIndex > crosswordArea[curCross.x].length) {
                                            isMatch = false;
                                            break;
                                        }

                                        crossVal.push(crosswordArea[curCross.x][yIndex]);
                                        crossVal.push(crosswordArea[curCross.x + 1][yIndex]);
                                        crossVal.push(crosswordArea[curCross.x - 1][yIndex]);
                                    }

                                    if (m > -1 && m < lenM - 1) {
                                        if (crossVal[0] !== curWord.char[m]) {
                                            if (crossVal[0] !== null) {
                                                isMatch = false;
                                                break;
                                            } else if (crossVal[1] !== null) {
                                                isMatch = false;
                                                break;
                                            } else if (crossVal[2] !== null) {
                                                isMatch = false;
                                                break;
                                            }
                                        }
                                    } else if (crossVal[0] !== null) {
                                        isMatch = false;
                                        break;
                                    }
                                }
                            }

                            if (isMatch === true) {
                                curWord.successfulMatches.push(curCross);
                            }
                        }
                    }
                }
            }

            curMatchDiff = curWord.totalMatches - curWord.effectiveMatches;

            if (curMatchDiff < minMatchDiff && curWord.successfulMatches.length > 0) {
                curMatchDiff = minMatchDiff;
                curIndex = i;
            } else if (curMatchDiff <= 0) {
                return false;
            }
        }
    }

    if (curIndex === -1) {
        return false;
    }

    var spliced = wordBank.splice(curIndex, 1);
    wordsActive.push(spliced[0]);

    var pushIndex = wordsActive.length - 1,
        rand = Math.random(),
        matchArr = wordsActive[pushIndex].successfulMatches,
        matchIndex = Math.floor(rand * matchArr.length),
        matchData = matchArr[matchIndex];

    wordsActive[pushIndex].x = matchData.x;
    wordsActive[pushIndex].y = matchData.y;
    wordsActive[pushIndex].dir = matchData.dir;

    if (!s) {
        wordsActive[pushIndex].char[0] = ++globalCount;
    }

    for (i = 0, len = wordsActive[pushIndex].char.length; i < len; i++) {
        var xIndex = matchData.x,
            yIndex = matchData.y;

        if (matchData.dir === 0) {
            xIndex += i;
            crosswordArea[xIndex][yIndex] = wordsActive[pushIndex].char[i];
        } else {
            yIndex += i;
            crosswordArea[xIndex][yIndex] = wordsActive[pushIndex].char[i];
        }

        Bounds.Update(xIndex, yIndex);
    }

    renderCrossWord(s)

    return true;

}

PopulateBoard(showWords);

//---------------------------------//
//   OBJECT DEFINITIONS            //
//---------------------------------//

function WordObj(stringValue) {
    this.string = stringValue;
    this.char = stringValue.split("");
    this.totalMatches = 0;
    this.effectiveMatches = 0;
    this.successfulMatches = [];
}

//---------------------------------//
//   EVENTS                        //
//---------------------------------//

document.getElementById("show__words").addEventListener('click', () => {
    showWords = !showWords;
    document.getElementById("show__words").innerHTML = showWords ? "Hide words" : "Show words";
    PopulateBoard(showWords);
})