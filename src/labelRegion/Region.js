import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import "./Region.css";
import delImage from "./del.png"

class Region extends Component {
  constructor() {
    super();
  }
  componentDidMount() {
   
  }
  
  _positonToStyle = (position) => {
    return {
      width: position.w + "%",
      height: position.h + "%",
      left: position.l + "%",
      top: position.t + "%",
    }
  }
  delLabel = () => {
    this.props.delLabel(this.props.index);
  }
  render() {
    const style = this._positonToStyle(this.props.position);
    if (this.props.active) {
      style.border = "1px solid #39f"
    }
    // console.log(style);
    return (
        <div ref="area" className="region-box" data-index={this.props.index} style={style} >
          {this.props.active ? (<div>
            <div ref="area-box" className="crop-box-content"></div>
            <span className="cropper-point point-e" data-direct="e"></span>
            <span className="cropper-point point-n" data-direct="n"></span>
            <span className="cropper-point point-w" data-direct="w"></span>
            <span className="cropper-point point-s" data-direct="s"></span>
            <span className="cropper-point point-ne" data-direct="ne"></span>
            <span className="cropper-point point-nw" data-direct="nw"></span>
            <span className="cropper-point point-sw" data-direct="sw"></span>
            <span className="cropper-point point-se" data-direct="se"></span>
            {this.props.label?(<div className="region-text"><span>{this.props.label.labelName}</span></div>): ""}
            <div className="region-footer" onClick={this.delLabel}>
              <img className="region-footer-image" src={delImage}/>
            </div>
            </div>
           ) : ""}
    
        </div> 
    )
  }
}

export default Region