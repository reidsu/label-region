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
      initialStyle: null,
      mobileStatusStyle: null,
      showMiniImage: false,
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
    let showMiniImage = false;
    // if (!nextProps.activeLabel && !nextProps.labelList && nextProps.enlargeCount === this.props.enlargeCount && nextProps.status === this.props.status) {
    //   return;
    // }
    // 获取已经绘画的矩形
    if (this.state.regionList.length === 0) {
      list = list.concat(this._parsePositionToStyle(nextProps.labelList || []));
    } else if (this.props.activeImage !== nextProps.activeImage) {
      activeRegion = null;
      list = list.concat(this._parsePositionToStyle(nextProps.labelList || []));
    } else {
      list = list.concat(this._parsePositionToStyle(this.state.regionList || []));
    }
    if (this.state.activeRegion !== null && nextProps.activeLabel) {
      if (this.props.activeImage === nextProps.activeImage && list[this.state.activeRegion]) {
        list[this.state.activeRegion].label = nextProps.activeLabel;
      }
    }
    let enlargeCount = nextProps.enlargeCount || this.state.enlargeCount;
    // 矫正最大值
    if (enlargeCount > 4) {
      enlargeCount = 4;
    } else if (enlargeCount < 1) {
      enlargeCount = 1;
    }
    if (enlargeCount > 1) {
      // 展示缩略图
      showMiniImage = true;
    }
    // 放大 缩小
    if (nextProps.enlargeCount !== this.state.enlargeCount) {
      if (enlargeCount === 1) {
        // 清理移动状态的style;
        this.setState({
          mobileStatusStyle: this._transformStyleMultiple(this.state.initialStyle, enlargeCount),
        })
      } else {
        let mobileStatusStyle = this.state.mobileStatusStyle || this.state.initialStyle;
        // console.log(mobileStatusStyle);
        mobileStatusStyle = this._transformStyleMultiple(mobileStatusStyle, enlargeCount);
        // console.log(mobileStatusStyle);
        this.setState({
          mobileStatusStyle
        });
      }
    }
    // console.log("切换", enlargeCount );
    if (nextProps.status !== this.props.status) {
      // 切换状态
      // console.log("切换状态");
      activeRegion = null;
      if (nextProps.status == 1) {
        // 标注状态
        if (nextProps.enlargeCount === 1) {
          // 清理container移动状态的style
          this.setState({
            mobileStatusStyle: this._transformStyleMultiple(this.state.initialStyle, enlargeCount),
          })
        }
        this.clearStatusEditEvent();
        this.registerStatusLabelEvent();
      } else if (nextProps.status == 2) {
      
        // 移动状态
        this.clearStatusLabelEvent();
        this.registerStatusEditEvent();
      }
    }
    
    this.setState({
      status: nextProps.status,
      regionList: list,   
      activeRegion,
      enlargeCount,
      showMiniImage
    }); 
  }
  
  componentDidMount() {
    const list = this._parsePositionToStyle(this.props.labelList || []);
    const style = this.props.style || {};
    style.width = style.width || 500;
    style.height = style.height || 350;
    style.top = 0;
    style.left = 0;
    style.position = "absolute";
    style.enlargeCount = 1;
    const enlargeCount = this.props.enlargeCount || 1;
    const initialStyle = style;
    this.setState({
      regionList: list,
      initialStyle: initialStyle,
      enlargeCount,
      status: this.props.status,
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
  closeDrag2 = (e) => {
    if (e) {
      e.stopImmediatePropagation();
    }
    this.initialStyle = null;
    this.currentMobileStyle = this.state.mobileStyle;
    this._clearNoQualifieRegion();
    this.refs.container.removeEventListener("mousemove", this.func);
  }
  registerStatusLabelEvent = () => {
    this.refs.container.addEventListener("mousedown", this.readyDraw);
    this.refs.container.addEventListener("mouseleave", this.closeDrag);
    this.refs.container.addEventListener("mouseup", this.closeDrag);
  }
  registerStatusEditEvent = () => {
    this.refs.container.addEventListener("mousedown", this.dragImage);
    this.refs.container.addEventListener("mouseleave", this.closeDrag2);
    this.refs.container.addEventListener("mouseup", this.closeDrag2);
  }
  clearStatusLabelEvent = (e) => {
    this.refs.container.removeEventListener("mouseleave", this.closeDrag);
    this.refs.container.removeEventListener("mousedown", this.readyDraw);
    this.refs.container.removeEventListener("mouseup", this.closeDrag);
  }
  clearStatusEditEvent = () => { 
    this.refs.container.removeEventListener("mousemove", this.closeDrag2);
    this.refs.container.removeEventListener("mousedown", this.dragImage);
    this.refs.container.removeEventListener("mouseup", this.closeDrag2);
  }
  registerMiniCardEvent = (miniCardDom) => {
    if (!miniCardDom) {
      return;
    }
    // 获取缩略
    this.miniContanerOffset = miniCardDom.getBoundingClientRect();
    // console.log(miniCardDom);
    miniCardDom.addEventListener("mouseup", this.clickMiniCard);
  }
  clickMiniCard = (e) => {
    e.stopImmediatePropagation();
    // 禁止拖动
    e.preventDefault();
    const miniBox = {
      width: 100,
      height: 62.5,
    }
    const relativeX = e.clientX - this.miniContanerOffset.left;
    const relativeY = e.clientY - this.miniContanerOffset.top;
    const boxStyle = JSON.parse(JSON.stringify(this._generaterImageStyle(this.state.mobileStatusStyle)));
    const miniRegion = this._generaterMiniRegion(boxStyle);
    const currentWidth = miniRegion.width.substring(0, miniRegion.width.length - 1) * miniBox.width / 100;
    const currentHeigth = miniRegion.height.substring(0, miniRegion.height.length - 1) * miniBox.height / 100;
    // 小矩形的坐标  且判断最小值
    let offsetX = relativeX - (currentWidth / 2) > 0 ? (relativeX - (currentWidth / 2)) / miniBox.width : 0;
    let offsetY = relativeY - (currentHeigth / 2) > 0 ? (relativeY - (currentHeigth / 2)) / miniBox.height : 0;
    if (miniBox.width * offsetX > miniBox.width - currentWidth) {
      // 判断偏移最大值
      offsetX = (miniBox.width - currentWidth ) / miniBox.width;
    }
    if (miniBox.height * offsetY > miniBox.height - currentHeigth) {
      // 判断偏移最大值
      offsetY = (miniBox.height - currentHeigth ) / miniBox.height;
    }
    boxStyle.left = this.state.initialStyle.left -(offsetX * this.state.mobileStatusStyle.width);
    boxStyle.top = this.state.initialStyle.top -(offsetY * this.state.mobileStatusStyle.height);
    this.setState({
      mobileStatusStyle: boxStyle
    })
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
    this.initialStyle = this.state.mobileStatusStyle;
    this.func = this.mobileImage;
    this.refs.container.addEventListener("mousemove", this.func);
  }
  mobileImage = (e) => {
    const offsetWidth = e.clientX - this.currentMousePoint.x;
    const offsetHeight = e.clientY - this.currentMousePoint.y;
    let initialStyle = JSON.parse(JSON.stringify(this.state.mobileStatusStyle));
  
    initialStyle.top = this.initialStyle.top + offsetHeight;
    initialStyle.left = this.initialStyle.left + offsetWidth;
    // console.log("top", initialStyle.top);
    if (initialStyle.top > this.state.initialStyle.top || initialStyle.left > this.state.initialStyle.left) {
      return;
    }
    if (initialStyle.top + initialStyle.height < this.state.initialStyle.top + this.state.initialStyle.height) {
      return;
    }
    if (initialStyle.left + initialStyle.width < this.state.initialStyle.left + this.state.initialStyle.width) {
      return;
    }
    this.setState({
      mobileStatusStyle: initialStyle
    })
  }

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
    this.currentAbsoluteMousePoint = {
      x: e.clientX,
      y: e.clientY
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
    // 放大倍数
    const m = this.containerOffset.width / containerOffset.width;
    // 8个方向
    const offsetX = (this.currentAbsoluteMousePoint.x - e.clientX) / m;
    const offsetY = (this.currentAbsoluteMousePoint.y - e.clientY) / m;
    switch (this.stretchDirect) {
      case "e":
        width = this.initialRegion.width - offsetX > 5 ? this.initialRegion.width - offsetX : 5;
        break;
      case "n":
        height = this.initialRegion.height + offsetY > 5 ? this.initialRegion.height + offsetY : 5;
        if (height !== 5) {
          top = this.initialRegion.top - offsetY;
        }
        break;
      case "s":
        height = this.initialRegion.height - offsetY > 5 ? this.initialRegion.height - offsetY : 5;
        break;
      case "w":
        width = this.initialRegion.width + offsetX > 5 ? this.initialRegion.width + offsetX : 5;
        if (width !== 5) {
          left = this.initialRegion.left - offsetX
        }
        break;
      case "ne":
        height = this.initialRegion.height + offsetY > 5 ? this.initialRegion.height + offsetY : 5;
        if (height !== 5) {
          top = this.initialRegion.top - offsetY;
        }
        width = this.initialRegion.width - offsetX > 5 ? this.initialRegion.width - offsetX : 5;     
        break;
      case "nw":
        height = this.initialRegion.height + offsetY > 5 ? this.initialRegion.height + offsetY : 5;
        if (height !== 5) {
          top = this.initialRegion.top - offsetY;
        }
        width = this.initialRegion.width + offsetX > 5 ? this.initialRegion.width + offsetX : 5;
        if (width !== 5) {
          left = this.initialRegion.left - offsetX
        }
        break;
      case "sw":
        height = this.initialRegion.height - offsetY > 5 ? this.initialRegion.height - offsetY : 5;
        width = this.initialRegion.width + offsetX > 5 ? this.initialRegion.width + offsetX : 5;
        if (width !== 5) {
          left = this.initialRegion.left - offsetX
        }
        break;
      case "se":
        height = this.initialRegion.height - offsetY > 5 ? this.initialRegion.height - offsetY : 5;
        width = this.initialRegion.width - offsetX > 5 ? this.initialRegion.width - offsetX : 5;
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
    const containerOffset = region.containerOffset;
    // 放大倍数
    const m = this.containerOffset.width / containerOffset.width;
    const cx = e.clientX;     // 光标移动到的点
    const px = this.currentMousePoint.x; // 光标落点
    const cy = e.clientY;     // 光标移动到的点
    const py = this.currentMousePoint.y; // 光标落点
    region.left = this.initialRegion.left + (cx - px - this.containerOffset.left)/ m;
    region.top = this.initialRegion.top + (cy - py - this.containerOffset.top) / m;
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
  _computerEditBoxStyle(style) {
    const width = style ? style.width : ""
    const height = style ? style.height : ""
    const top = style ? style.top : ""
    const left = style ? style.left : ""
    return {
      position: "absolute", 
      width: width * this.state.enlargeCount, 
      height: height * this.state.enlargeCount, 
      top: top - (height / 2) * (this.state.enlargeCount - 1), 
      left: left - (width / 2) * (this.state.enlargeCount - 1), 
    };
  }
  _toLabelContainerStyle(style) {
    const width = style ? style.width : ""
    const height = style ? style.height : ""
    const top = style ? style.top : ""
    const left = style ? style.left : ""
    return {
      position: "relative",
      overflow: "hidden",
      width, height, top, left
    };
  }
  _transformStyleMultiple(style, targetM) {
    // 将initstyle放大targetM - currentM 倍
    // 获取initStyle
    const maxTop = this.state.initialStyle.top;
    const maxLeft = this.state.initialStyle.left;
    const currentM = style.enlargeCount;
    let width, height, top, left;
    width = style.width / currentM * targetM;
    height = style.height / currentM * targetM;
    const minLeft = this.state.initialStyle.left + this.state.initialStyle.width - width;
    const minTop = this.state.initialStyle.top + this.state.initialStyle.height - height;
    top = style.top - this.state.initialStyle.height / 2 * (targetM - currentM);
    left = style.left - this.state.initialStyle.width / 2 * (targetM - currentM);
    if (top > maxTop ) {
      top = maxTop;
    }
    if (top < minTop) {
      top = minTop;
    }
    if (left < minLeft) {
      left = minLeft;
    }
    if (left > maxLeft) {
      left = maxLeft;
    }
    return {
      width, height, top, left, 
      display: "block",
      position: "absolute",
      userSelect: "none",
      enlargeCount: targetM
    }
  }
  _toLabelImageStyle(style) {
    const imageStyle = this._toLabelContainerStyle(style);
    delete imageStyle.overflow;
    imageStyle.position = "absolute";
    return imageStyle;
  }
  _generaterMiniRegion(style) {
    if (!this.state.showMiniImage) {
      return {};
    }
    const miniStyle = {};
    miniStyle.width = 100 / style.enlargeCount + "%";
    miniStyle.height = 100 / style.enlargeCount + "%";
    miniStyle.left = (this.state.initialStyle.left - style.left) * 100 / style.width + "%";
    miniStyle.top = (this.state.initialStyle.top - style.top) * 100 / style.height + "%";
    return miniStyle
  }
  _generaterImageStyle = () => {
    let imageStyle;
    if (this.state.status === 1) {
      if (this.state.enlargeCount > 1) {
        imageStyle = this.state.mobileStatusStyle
      } else {
        imageStyle = this._toLabelImageStyle(this.state.initialStyle);
      }
    } else {
      imageStyle = this.state.mobileStatusStyle || this._toLabelImageStyle(this.state.initialStyle);
    }
    return imageStyle;
  }
  render() {
    const img = this.props.image;
    const containerStyle = this._toLabelContainerStyle(this.state.initialStyle);
    const imageStyle = this._generaterImageStyle();
    const miniImageRegion = this._generaterMiniRegion(imageStyle);
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
        {this.state.showMiniImage ? (<div 
           className="mini-card"
            ref={this.registerMiniCardEvent}
          >
          <img className="mini-image" src={img}/>
          <div className="mini-image-region"  style={miniImageRegion}/>
        </div>): ""}
      </div >
    )
  }
}


export default DragRegion;