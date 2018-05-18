export default class WordCloud {
    constructor(baseWord, ...args){
        this.words = {};
        this.baseWord = baseWord.toLowerCase();
        this.excludedStrings = [
            'a',
            'that',
            'my',
            'me',
            'at',
            'the',
            'i',
            'to',
            'you',
            'what',
            'who',
            'where',
            'how',
            'why',
            'on',
            'this',
            'also',
            'of',
            'my',
            'it',
            'up',
            'he',
            'she',
            'they',
            'us',
            'ours',
            'got',
            'has',
            'for',
            'yes',
            'no',
            'into',
            'and',
            'their',
            'in',
            'is',
            'with',
            'your',
            'are',
            'get',
            'do',
            'or',
            'so',
            'have',
            'if',
            'as',
            'like',
            'i\'m',
            'but',
            'really',
            'be',
            'can',
            'don\'t',
            'not',
            'was',
            'any',
            'from',
            'there',
            'out',
            'am',
            'been',
            'would',
            'had',
            'i\'ve',
            'some',
            'an',
            'because',
            'when',
            'will',
            'too',
            'by',
            'his',
            'her',
            'their',
            'our',
            'just',
            'said',
            'about',
            'it\'s',
            'him',
            'even',
            'all',
            'we',
            'them',
            'still',
            'off',
            'on',
            'go',
            'going',
            'more',
            'after',
            'before',
            'now',
            'which',
            'much',
            'ever',
            'one',
            'being'
        ];
        args.forEach(arr => {
            arr.forEach(str => {
                const splitStr = str.split(/\s/);
                splitStr.forEach(el =>  {
                    const trimmed = this.trim(el).toLowerCase();
                    if(trimmed && this.shouldBeAdded(trimmed)){
                        this.words.hasOwnProperty(trimmed) ? this.words[trimmed]++ : this.words[trimmed] = 1;
                    }
                });
            });
        });
    }

    trim = (str) => {
        let end = 0;
        let start = 0;
        for(let i = 0; i < str.length; i++){
            if(str[i].match(/[a-zA-Z]/))
                end = i;
        }
        for(let k = str.length-1; k >= 0; k--){
            if(str[k].match(/[a-zA-Z]/)){
                start = k;
            }
        }   
        return start < end ? str.slice(start, end+1) : '';
    }

    weightRatio = (str) => {
        if(this.words.hasOwnProperty(str))
            return this.words[str]/this.totalWeight;
        return 0;
    }

    shouldBeAdded = (str) => {
        if(this.excludedStrings.indexOf(str) < 0 && this.baseWord.indexOf(str) == -1){
            return true;
        }
        return false;                
    }

    toSortedArray = (words) => {
        return Object.keys(words).sort(function(a,b){return words[b]-words[a]})
    }


}