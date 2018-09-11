import React, { Component } from 'react';
import LabelRegion from "./labelRegion/index";
import dog0 from "./images/dog0.jpg";
import dog1 from "./images/dog1.jpg";
import dog2 from "./images/dog2.jpg";
import dog3 from "./images/dog3.jpg";
import dog4 from "./images/dog4.jpg";
import dog5 from "./images/dog5.jpg";

import './App.css';

class App extends Component {
  constructor() {
    super();
    this.state = {
      activeImageIndex: 0,
      activeLabel: null,
      labelList: [{labelName: "dog", id:"1"}, {labelName: "cat", id: "2"}],
      imageList: [dog0, dog1, dog2, dog3, dog4, dog5],
      enlargeCount: 1,
      status: 1,
    }
    
  }
  selectImage = (i) => {
    this.setState({
      activeImageIndex: i,
      enlargeCount: 1,
    })
  }
  selectLabel = (i) => {
    this.setState({
      activeLabel: this.state.labelList[i]
    })
  }
  adjust = (isEnlarge) => {
    const value = isEnlarge ? this.state.enlargeCount +1 : this.state.enlargeCount - 1;
    if (value < 1 || value > 4) {
      return;
    }
    this.setState({
      enlargeCount: value
    })
  }
  mobile = () => {
    this.setState({
      status: this.state.status === 1 ? 2 : 1,
    })
  }
  render() {
    const imageList = this.state.imageList.map((img, i) => {
      const style = { width: 120, height: 80 };
      if (i === this.state.activeImageIndex) {
        style.border ="3px solid #5E8CF4"
      }
      return (<div key={i} className="image-card" onClick={this.selectImage.bind(this, i)}>
        <img style={style} src={img} />
      </div>)
    })
    const labelList = this.state.labelList.map((label, i) => {
      return (
        <div className="label-item" key={i} onClick={this.selectLabel.bind(this, i)}>
          {label.labelName}
        </div>
      )
    })
    console.log(this.state.status);
    return (
      <div className="App">
      <div className="image-list">
          <div>请选择图片</div>
          {imageList}
      </div>
        <div className="container">
          <div className="container-left">
            <div className="menu">
              <a className="menu-butten" onClick={this.adjust.bind(this, true)}>放大</a>
              <a className="menu-butten" onClick={this.adjust.bind(this, false)}>缩小</a>
              <a className="menu-butten" onClick={this.mobile} >{this.state.status === 2 ? "正在移动" : "正在标注"}</a>
            </div>
            <div>
              <LabelRegion 
                activeImage={this.state.activeImageIndex}
                image={this.state.imageList[this.state.activeImageIndex]} 
                label={this.state.activeLabel} 
                style={{ width: 500, height: 350}} 
                enlargeCount={this.state.enlargeCount}
                status={this.state.status}
              />
            </div>
          </div>
            <div className="container-right">
              <div className="label-header">
                标签
              </div>
              <div className="label-list">
                {labelList}
              </div>
            </div>
        </div>
      </div>

    );
  }
}

export default App;
