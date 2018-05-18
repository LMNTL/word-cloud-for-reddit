/*global chrome*/
import React, { Component } from 'react';
import axios from 'axios';
import './App.css';
import WordCloud from './wordcloud.js';
import randomColor from 'randomcolor';
import domtoimage from 'dom-to-image';
import expand from './expand.svg';
import WordCloudView from './wordcloudview.js';
var FileSaver = require('file-saver');

class App extends Component {
  constructor(){
    super();
    this.state = {
      titles: [],
      content: [],
      submitted: false,
      response: '',
      minFontSize: 10,
      maxFontSize: 40,
      padding: 8,
      limit: 50,
      pages: 8,
      errorText: '',
      removedWords: 0,
      subreddit: '',
      query: '',
      resizing: false,
      windowWidth: 400,
      windowHeight: 400,
      textColors: []
    };
    this.wordcloudRef = React.createRef();
  }

  randomFloatRange = (val1, val2) => {
    const min = Math.max(val1, val2);
    const max = Math.min(val1, val2);
    return ( Math.random() * ( max - min ) ) + min;
  }

  componentDidMount = () => {
    this.getURL();
    let textColors = [];
    for(let i=0; i < 20; i++){
      textColors.push(randomColor());
    }
    let transitionArray = new Array(20);
    transitionArray = transitionArray.map( el => this.randomFloatRange(0, .5) );
    this.setState({
      transitionArray,
      textColors
    });
  }

  getURL = () => {
    let tabURL = '';
    const scope = this;
    chrome.runtime.sendMessage({geturl: "GetURL"},
      function (response) {
        if(response.searchURL){
          tabURL = response.searchURL;
          scope.getSearchResults(tabURL);
        } else {
          scope.setState({errorText: "Error while getting url from background script. Try disabling other extensions in case they're conflicting."})
        }
    });
  }

  getSearchResults = (searchURL) => {
    const searchIndex = searchURL.indexOf('search') + 6;
    const queryStart = searchURL.indexOf('q=') + 2;
    const queryEnd = searchURL.indexOf('&') || searchURL.length - 1;
    const unescapedQuery = decodeURI(searchURL.slice(queryStart, queryEnd));
    if(!unescapedQuery){
      this.setState({errorText: "No search results found."});
      return;
    }
    this.setState({query: unescapedQuery});
    const jsonUrl = searchURL.slice(0,searchIndex) + '.json' + searchURL.slice(searchIndex);
    this.getNextPages(jsonUrl, this.makeWordcloud);
  }

  getNextPages = (request, finishCallback) => {
    if(this.state.pages){
      axios.get(request)
      .then(res => {
        res.data.data.children.forEach(post => {
          try{
            this.state.titles.push(post.data.title);
            this.state.content.push(post.data.selftext);
          } catch(e){
            this.setState({errorText: "No search results found."});
          }
        });
        this.setState({pages: this.state.pages-1});
        let newRequest = request;
        if(!newRequest.match(/after/))
          newRequest += '&after=';
        else{
          newRequest = newRequest.slice(0,-9);
        }
        newRequest += res.data.data.after;
        this.getNextPages(newRequest, finishCallback);
      }).catch(err => {
        if(this.state.titles && this.state.content && this.state.titles != [] && this.state.content != []){
          finishCallback();
        } else {
          this.setState({errorText: "Couldn't load search from reddit. Check your internet connection and try again."})
        }
      });
    } else {
      finishCallback();
    }
  }

  makeWordcloud = () => {
    const wordcloud = new WordCloud(this.state.query, this.state.titles, this.state.content);
    const allSorted = wordcloud.toSortedArray(wordcloud.words);
    const topSorted = allSorted.slice(0,20);
    if(!topSorted || topSorted.length == 0){
      this.setState({errorText: "No search results found."});
      return;
    }
    const largestWeight = wordcloud.words[allSorted[0]];
    const lowestWeight = wordcloud.words[allSorted[19]];
    this.setState( {
      wordcloud,
      allSorted,
      topSorted,
      largestWeight,
      lowestWeight,
      submitted: true
    } );
  }

  getWordFontSize = (word) => {
    return ( ( ( this.state.wordcloud.words[word] - this.state.lowestWeight ) / (this.state.largestWeight - this.state.lowestWeight) ) * (this.state.maxFontSize - this.state.minFontSize) ) + this.state.minFontSize;  
  }

  saveImage = () => {
    const scope = this;
    domtoimage.toBlob(this.wordcloudRef.current)
      .then(blob => {
        const date = new Date(Date.now());
        FileSaver.saveAs(blob, `${scope.state.query}_${date.toLocaleString()}.png`);
      })
      .catch(e => {
        this.setState({errorText: "Couldn't save image. Reload and try again."})
      });
  }

  removeWord = (e) => {
    const indexToRemove = this.state.topSorted.indexOf(e.target.innerText);
    const newTopSorted = [...this.state.topSorted];
    newTopSorted.splice(indexToRemove, 1);
    newTopSorted.push(this.state.allSorted[20+this.state.removedWords]);
    newTopSorted.sort((wordA, wordB) => this.state.wordcloud.words[wordA] > this.state.wordcloud.words[wordB]);
    const largestWeight = this.state.wordcloud.words[newTopSorted[0]];
    const lowestWeight = this.state.wordcloud.words[newTopSorted[19]];
    this.setState({
      topSorted: newTopSorted,
      removedWords: this.state.removedWords + 1,
      largestWeight,
      lowestWeight,
      maxFontSize: this.state.maxFontSize * 0.9
    });
  }

  hideUI = () => {
    this.setState({UIHidden: true});
  }

  showUI = () => {
    this.setState({UIHidden: false});
  }

  startResize = (event) => {
    event.preventDefault();
    this.setState({
      resizing: true,
      lastResizeMouseX: event.screenX,
      lastResizeMouseY: event.screenY
    });
    window.addEventListener("mousemove", this.resize)
    window.addEventListener("mouseup", this.stopResize)
  }

  stopResize = (event) => {
    event.preventDefault();
    this.setState({resizing: false});
    window.removeEventListener("mouseup", this.stopResize);
    window.removeEventListener("mousemove", this.resize)
  }

  componentWillUnmount = () => {
    window.removeEventListener("mouseup", this.stopResize);
    window.removeEventListener("mousemove", this.resize);
  }

  resize = (event) => {
    event.preventDefault();
    let newWidth = this.state.windowWidth - ( event.screenX - this.state.lastResizeMouseX );
    newWidth = Math.max( Math.min(newWidth, 600), 200);
    let newHeight = this.state.windowHeight + ( event.screenY - this.state.lastResizeMouseY );
    newHeight = Math.max( Math.min(newHeight, 600), 200);
    this.setState({
      windowWidth: newWidth,
      windowHeight: newHeight,
      lastResizeMouseX: event.screenX,
      lastResizeMouseY: event.screenY,
      minFontSize: newWidth / 25,
      maxFontSize: newWidth / 10,
    });
  }

  render() {
    if(!this.state.errorText){
      return (
        <div className='background popup'>
          {this.state.submitted ?
            <div>
              <div
                ref={this.wordcloudRef}
                className='background'
              >
              {(this.state.topSorted && this.state.topSorted != []) ? <WordCloudView
                windowWidth={this.state.windowWidth}
                windowHeight={this.state.windowHeight}
                textColors={this.state.textColors}
                getWordFontSize={this.getWordFontSize}
                topSorted={this.state.topSorted}
                transitionArray={this.state.transitionArray}
                removeWord={this.removeWord}
                resizing={this.state.resizing}
                padding={this.state.padding}
                words={this.state.wordcloud.words}
              /> : this.setState({errorText: "No search results found."})}
            </div>
            <button
              className={'saveimage '.concat(this.state.UIHidden ? 'hidden' : 'visible')}
              onClick={this.saveImage}
            >
              Save as image
            </button>
            <img
              src={expand}
              className='expand'
              alt='resize window'
              onMouseDown={this.startResize}
            />
          </div> :
          <div class='fixedwidth'>
            <div class='container' alt='loading'>
              <i class='preloader'></i>
            </div>
          </div>
          }
        </div>
      )
    } else {
      return (
        <div className='background popup errortext fixedwidth' alt='error'>{this.state.errorText}</div>
      )
    }
  }
}

export default App;
