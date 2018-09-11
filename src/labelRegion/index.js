import React, { Component } from 'react';
import Region from "./Region";
import "./index.css"

// props: {
//   regionList
//   style: {width, height}
//   activeRegion
//   image
//   action 
//   
// }
// action: "label", ""
class DragRegion extends Component {
  constructor() {
    super();
    this.state = {
      regionList: [],
      activeRegion: null,
      enlargeCount: 1,  // 0 - 4
    }
  }
  componentDidUpdate() {
    if (this.props.onChangeRegion) {
      this.props.onChangeRegion(this._stypeToPosition(this.state.regionList))
    }
  }
  
  componentWillReceiveProps(nextProps) {
    let list = [];
    let activeRegion = this.state.activeRegion;
    if (!nextProps.labelList && nextProps.enlargeCount === this.props.enlargeCount && nextProps.status === this.props.status) {
      return;
    }
    if (this.state.regionList.length === 0) {
      list = list.concat(this._parsePositionToStyle(nextProps.labelList || []));
    } else if (this.props.activeImage !== nextProps.activeImage) {
      activeRegion = null;
      list = list.concat(this._parsePositionToStyle(nextProps.labelList || []));
    } else {
      list = list.concat(this._parsePositionToStyle(this.state.regionList || []));
    }
    if (this.state.activeRegion !== null && nextProps.label) {
      if (this.props.activeImage === nextProps.activeImage) {
        list[this.state.activeRegion].label = nextProps.label;
      }
    }
    let enlargeCount = nextProps.enlargeCount || this.state.enlargeCount;
    if (enlargeCount > 4) {
      enlargeCount = 4;
    } else if (enlargeCount < 1) {
      enlargeCount = 1
    }
    if (nextProps.status !== this.props.status) {
      if (nextProps.status == 1) {
        // 标注状态
        this.clearStatusMobileEvent();
        this.registerStatusLabelEvent();

      } else if (nextProps.status == 2) {
        // 移动状态
        this.clearStatusLabelEvent();
        this.registerStatusMobileEvent();
      }
    }
    this.setState({
      regionList: list,
      activeRegion,
      enlargeCount,
    });
    // setTimeout(() => {
    //   this.containerOffset = this.refs.container.getBoundingClientRect();
    // })
    
  }
  
  componentDidMount() {
    const list = this._parsePositionToStyle(this.props.labelList || []);
    const style = this.props.style || {};
    style.width = style.width || 500;
    style.height = style.height || 350;
    style.top = 0;
    style.left = 0;
    style.position = "absolute";
    const enlargeCount = this.props.enlargeCount || 1;
    const initialStyle = style;
    this.setState({
      regionList: list,
      initialStyle: initialStyle,
      enlargeCount,
    });
    this.registerStatusLabelEvent();
  }

  closeDrag = (e) => {
    if (e) {
      e.stopImmediatePropagation();
    }
    this._clearNoQualifieRegion();
    this.refs.container.removeEventListener("mousemove", this.func);
  }
  registerStatusLabelEvent = () => {
    this.refs.container.addEventListener("mousedown", this.readyDraw);
    this.refs.container.addEventListener("mouseleave", this.closeDrag);
    this.refs.container.addEventListener("mouseup", this.closeDrag);
  }
  registerStatusMobileEvent = () => {
    this.refs.container.addEventListener("mousedown", this.dragImage);
    this.refs.container.addEventListener("mouseleave", this.closeDrag);
    this.refs.container.addEventListener("mouseup", this.closeDrag);
  }
  clearStatusLabelEvent = (e) => {
    this.refs.container.removeEventListener("mousemove", this.closeDrag);
    this.refs.container.removeEventListener("mousedown", this.readyDraw);
    this.refs.container.removeEventListener("mouseup", this.closeDrag);
  }
  dragImage = (e) => {
    if (this.state.enlargeCount === 1) {
      return;
    }
    e.stopImmediatePropagation();
    // 禁止拖动
    e.preventDefault();
    this.containerOffset = this.refs.container.getBoundingClientRect();
    this.currentMousePoint = {
      x: e.clientX,
      y: e.clientY,
    }
    this.func = this.mobileImage;
    this.refs.container.addEventListener("mousemove", this.func);
    // console.log(this.containerOffset);
    // console.log(this.currentMousePoint);
  }
  mobileImage = (e) => {
    console.log(e);
  }
  clearStatusMobileEvent = () => {}
  readyDraw = (e) => {
    e.stopImmediatePropagation();
    // 禁止拖动
    e.preventDefault();
    this.containerOffset = this.refs.container.getBoundingClientRect();
    // 记录当前鼠标落点
    this.currentMousePoint = {
      x: e.clientX - this.containerOffset.left,
      y: e.clientY - this.containerOffset.top
    }
    // 判断鼠标落点是已经存在的矩形上 还是画布上 或是矩形的边缘
    if (e.target.classList.contains("container-box")) {
      // 创建新矩形
      this.createRegion(e);
    } else if (e.target.classList.contains("region-box")) {
      const index = e.target.dataset.index; // 要被拖动的矩形坐标
      this.setState({activeRegion: index});
      this.dragRegion(e, index);
    } else  {
      // 拉伸矩形
      this.stretchRegion(e);
    }
  }
  createRegion(e) {
    const x = e.clientX;
    const y = e.clientY;
    const currentRegion = {
      left: x - this.containerOffset.left,
      top: y - this.containerOffset.top,
      containerOffset: this.containerOffset
    }
    const list = this.state.regionList;
    const index = list.length;
    // 创建一个矩形 
    list.push(currentRegion);
    // 关闭所有active
    const regionList = this._clearActive(list);
    // 记录所创建矩形的在数组中位置
    this.func = this.drawRegion.bind(this, index)
    this.refs.container.addEventListener("mousemove", this.func);
    this.setState({activeRegion: regionList.length - 1, regionList});
  }
  dragRegion = (e, index) => {
    // 记录矩形初始状态
    this.initialRegion = JSON.parse(JSON.stringify(this.state.regionList[index]));
    this.func = this.draging.bind(this, index);
    this.refs.container.addEventListener("mousemove", this.func);
  }
  stretchRegion = (e) => {
    this.initialRegion = JSON.parse(JSON.stringify(this.state.regionList[this.state.activeRegion]));
    this.stretchDirect = e.target.dataset.direct; // 拉伸方向
    this.func = this.stretching;
    this.refs.container.addEventListener("mousemove", this.func);
  }
  stretching = (e) => {
    const list = this.state.regionList;
    const activeRegionIndex = this.state.activeRegion;
    const region = list[activeRegionIndex];
    const containerOffset = region.containerOffset;
    let width, top, height, left;
    // 8个方向
    switch (this.stretchDirect) {
      case "e":
        width = e.clientX - this.currentMousePoint.x + this.initialRegion.width - this.containerOffset.left;
        break;
      case "n":
        const noffsetHeight = this.initialRegion.height  + this.currentMousePoint.y + this.containerOffset.top - e.clientY;
        top = noffsetHeight > 5 ? e.clientY - this.containerOffset.top : this.initialRegion.top + this.initialRegion.height - 5;
        height = noffsetHeight > 5 ? noffsetHeight : 5;
        break;
      case "s":
        height = e.clientY  - this.currentMousePoint.y + this.initialRegion.height - this.containerOffset.top;
        break;
      case "w":
        const woffsetWidth = this.initialRegion.width  + this.currentMousePoint.x + this.containerOffset.left - e.clientX;
        left = woffsetWidth > 5 ? e.clientX - this.containerOffset.left : this.initialRegion.left + this.initialRegion.width - 5 ;
        width = woffsetWidth > 5 ? woffsetWidth : 5;
        break;
      case "ne":
        const neoffsetHeight = this.initialRegion.height  + this.currentMousePoint.y + this.containerOffset.top - e.clientY;
        top = neoffsetHeight > 5 ? e.clientY - this.containerOffset.top : this.initialRegion.top + this.initialRegion.height - 5;
        height = neoffsetHeight > 5 ? neoffsetHeight : 5;
        width = e.clientX - this.currentMousePoint.x + this.initialRegion.width - this.containerOffset.left;        
        break;
      case "nw":
        const nwoffsetWidth = this.initialRegion.width  + this.currentMousePoint.x + this.containerOffset.left - e.clientX;
        left = nwoffsetWidth > 5 ? e.clientX - this.containerOffset.left : this.initialRegion.left + this.initialRegion.width - 5 ;
        width = nwoffsetWidth > 5 ? nwoffsetWidth : 5;
        const nwoffsetHeight = this.initialRegion.height  + this.currentMousePoint.y + this.containerOffset.top - e.clientY;
        top = nwoffsetHeight > 5 ? e.clientY - this.containerOffset.top : this.initialRegion.top + this.initialRegion.height - 5;
        height = nwoffsetHeight > 5 ? nwoffsetHeight : 5;
        break;
      case "sw":
        height = e.clientY  - this.currentMousePoint.y + this.initialRegion.height - this.containerOffset.top;
        const swoffsetWidth = this.initialRegion.width  + this.currentMousePoint.x + this.containerOffset.left - e.clientX;
        left = swoffsetWidth > 5 ? e.clientX - this.containerOffset.left : this.initialRegion.left + this.initialRegion.width - 5 ;
        width = swoffsetWidth > 5 ? swoffsetWidth : 5;
        break;
      case "se":
        height = e.clientY  - this.currentMousePoint.y + this.initialRegion.height - this.containerOffset.top;
        width = e.clientX - this.currentMousePoint.x + this.initialRegion.width - this.containerOffset.left;
        break;
      }
      region.width = width ? width  : region.width;
      region.top = top ? top  : region.top;
      region.height = height ? height  : region.height;
      region.left = left ? left  : region.left;
      list[activeRegionIndex] = region;
      this.setState({
        regionList: list
      })
  }
  draging = (index, e) => {
    const list = this.state.regionList;
    const region = list[index];
    const cx = e.clientX;     // 光标移动到的点
    const px = this.currentMousePoint.x; // 光标落点
    const cy = e.clientY;     // 光标移动到的点
    const py = this.currentMousePoint.y; // 光标落点
    region.left = this.initialRegion.left + cx - px - this.containerOffset.left;
    region.top = this.initialRegion.top + cy - py - this.containerOffset.top;
    list[index] = region;
    this.setState({
      regionList: list
    })
  }
  
  drawRegion = (index, e) => {
    const list = this.state.regionList;
    const region = list[index];
    if (this.currentMousePoint.x <= e.clientX - this.containerOffset.left) {
      region.width = e.clientX - this.containerOffset.left - this.currentMousePoint.x;
    } else {
      region.width = this.currentMousePoint.x + this.containerOffset.left - e.clientX;
      region.left = e.clientX - this.containerOffset.left;
    }
    if (this.currentMousePoint.y <= e.clientY - this.containerOffset.top) {
      region.height =  e.clientY - this.currentMousePoint.y - this.containerOffset.top;
    } else {
      region.top = e.clientY - this.containerOffset.top;
      region.height = this.containerOffset.top + this.currentMousePoint.y - e.clientY ;
    }
    list[index] = region;
    this.setState({regionList: list});
  }
  _getProps(dom, style) {
    return window.getComputedStyle(dom, null)[style];
  }
  _clearActive(list) {
    return list.map(region => {
      if (region.isActive) {
        delete region.isActive;
      }
      return region;
    })
  }
  _parsePositionToStyle(position) {
    return position.map((p) => {
      if (p.left && p.top) {
        return p;
      }
      return {
        label: p.label,
        left: p.x1,
        width: p.x2 - p.x1,
        top: p.y1,
        height: p.y2 - p.y1
      }
    })
  }
  _stypeToPosition(styles) {
    return styles.map((style) => {
      return {
        x1: style.left,
        x2: style.left + style.width,
        y1: style.top,
        y2: style.top + style.height,
        label: style.label,
      }
    })
  }
  onActive = (index) => {
    this.setState({
      activeRegion: index,
    })
  }
  delLabel = (index) => {
    const list = this.state.regionList;
    this.setState({
      regionList: list.filter((r, i) => {
        if (i === index) return false;
        return true
      })
    })
  }
  onChange = (index, label) => {
    const list = this.state.regionList;
    list[index] = label;
    this.setState({
      regionList: list
    })
  }
  _clearNoQualifieRegion() {
    const list = this.state.regionList.filter(region => {
      if (!region.width || !region.height) {
        return false
      }
      if (!region.label && (region.width < 3 || region.height < 3)) {
        return false;
      }
      return true;
    })
    if (list.length != this.state.regionList.length) {
      this.setState({regionList: list})
    }
  }
  _computerStyle(style) {
    const width = style ? style.width : ""
    const height = style ? style.height : ""
    const top = style ? style.top : ""
    const left = style ? style.left : ""
    const containerStyle = {
      position: "relative",
      overflow: "hidden",
      width, height, top, left
    };
    const imageStyle = {
      position: "absolute", 
      width: width * this.state.enlargeCount, 
      height: height * this.state.enlargeCount, 
      top: top - (height / 2) * (this.state.enlargeCount - 1), 
      left: left - (width / 2) * (this.state.enlargeCount - 1), 
    };
    return { containerStyle, imageStyle}
  }
  render() {
    const img = this.props.image;
    const { containerStyle, imageStyle} = this._computerStyle(this.state.initialStyle)
    return (
      <div  className="drag-container" style={containerStyle}>
        <img ref="img" className="drag-container-image" style={imageStyle} src={img}>
        </img>
        <div ref="container" className="container-box" style={imageStyle}>
          {this.state.regionList.map((region, index) => {
            return (<Region
              key={index}
              index={index}
              boxStyle={region.containerOffset}
              label={region.label}
              change={this.onChange}
              handleActive={this.onActive.bind(this)}
              active={this.state.activeRegion == index}
              delLabel={this.delLabel}
              position={region}
            />);
          })}
        </div>
     
      </div >
    )
  }
}


export default DragRegion;