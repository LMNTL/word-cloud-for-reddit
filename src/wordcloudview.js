import React, { Component } from 'react';
import TagCloud from 'react-tag-cloud';

class WordCloudView extends Component{
    render = () => {
        if(!this.props.resizing){
            return (
                <TagCloud
                    style={{
                        fontSize: 50,
                        fontFamily: 'Segoe UI',
                        fontWeight: 'bold',
                        padding: this.props.padding,
                        width: this.props.windowWidth.toString().concat('px'),
                        height: this.props.windowHeight.toString().concat('px')
                    }}>
                    {this.props.topSorted.map( (el, ind, arr) => {
                        return (
                            <div
                                key={ind}
                                className='word'
                                onClick={this.props.removeWord}
                                alt={`weight: ${this.props.words[el]}`}
                                style={{
                                    fontSize: this.props.getWordFontSize(el),
                                    animationName: 'fadeIn',
                                    animationDelay: this.props.transitionArray[ind],
                                    animationIterationCount: 'once',
                                    animationDuration: '0.5s',
                                    color: this.props.textColors[ind],
                                    textShadow: 'rgba(100, 100, 100, 0.8) 1px 1px',
                                }}
                                
                            >
                                {el}
                            </div>
                        );
                    })}
                </TagCloud>
            );
        } else {
            return (
                <div style={{
                    width: this.props.windowWidth.toString().concat('px'),
                    height: this.props.windowHeight.toString().concat('px')
                }}/>
            );
        }
    }
}

export default WordCloudView;