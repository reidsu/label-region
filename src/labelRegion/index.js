import React, { Component } from 'react';
import Region from "./Region";
import "./index.css"
// import { message } from "antd";
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
    // console.log("nextProps.status", nextProps.status);
    // console.log("nextProps.enlargeCount", nextProps.enlargeCount);
    let isNeedSetState = false;
    let list = this.state.regionList;
    let activeRegion = this.state.activeRegion;
    if (nextProps.status === 3) {
      if (this.state.activeRegion) {
        this.setState({
          activeRegion: null
        })
      }
     
      this.clearStatusLabelEvent();
      this.clearStatusEditEvent(); 
      return;
    }
  
    if (this.props.activeImage !== nextProps.activeImage) {
      isNeedSetState = true;
      activeRegion = null;
      list = this._updateReionList(nextProps.regionList || [], []);
    } else {
      if (!this._compareRegion(nextProps.regionList || [], this.props.regionList || [])) {
        // regionList发生变化
        // 更新state的regionlist
        isNeedSetState = true;
        list = this._updateReionList(nextProps.regionList || [], this.state.regionList || []); 
      }
    }
    
    if (this.state.activeRegion !== null && nextProps.activeLabel) {
      if (this.props.activeImage === nextProps.activeImage && list[this.state.activeRegion]) {
        isNeedSetState = true;
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
    if (enlargeCount > 1 && nextProps.status === 2) {
      // 展示缩略图
      this.setState({
        showMiniImage: true
      })
      
    } 
    // 放大 缩小
    if (nextProps.enlargeCount !== this.state.enlargeCount) {
      isNeedSetState = true;
      if (enlargeCount === 1) {
        // 清理移动状态的style;
        this.setState({
          showMiniImage: false,
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
     
      isNeedSetState = true;
      // 切换状态
      // console.log("切换状态");
      activeRegion = null;
      if (nextProps.status == 1) {
        // 标注状态
        this.setState({
          showMiniImage: false
        })
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
    if (isNeedSetState) {
      this.setState({
        status: nextProps.status,
        regionList: list,   
        activeRegion,
        enlargeCount,
        // showMiniImage
      }); 
    }
  
  }
  
  componentDidMount() {
    const style = this.props.style || {};
    style.width = style.width || 500;
    style.height = style.height || 350;
    style.top = 0;
    style.left = 0;
    style.position = "absolute";
    style.enlargeCount = 1;
    this.style = style;
    const list = this._parsePositionToStyle(this.props.regionList || [], this.style);
    const enlargeCount = this.props.enlargeCount || 1;
    const initialStyle = style;
    this.setState({
      regionList: list,
      initialStyle: initialStyle,
      enlargeCount,
      status: this.props.status,
      regionMixSize: this.props.regionMixSize || 20,
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
      offsetY = (miniBox.height - currentHeigth + 3) / miniBox.height;
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
    this.containerOffset = this._getBoxStyle(this.refs.container);
    // this.containerOffset = this.refs.container.getBoundingClientRect();
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
    this.containerOffset = this._getBoxStyle(this.refs.container);
    // this.containerOffset = this.refs.container.getBoundingClientRect();
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
    const containerOffset = JSON.parse(JSON.stringify(this.containerOffset));
    const left =  x - this.containerOffset.left;
    const top =  y - this.containerOffset.top;
    const currentRegion = {
      l:  new Number(left / (containerOffset.width / 100)).toFixed(3),
      t:  new Number(top / (containerOffset.height / 100)).toFixed(3),
      containerOffset,
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
    let  w, t, h, l;
    const minWidth = Number(this.state.regionMixSize / this.state.initialStyle.width) * 100;
    const minHeigth = Number(this.state.regionMixSize / this.state.initialStyle.height) * 100;
    const offsetXPercen = Number((this.currentAbsoluteMousePoint.x - e.clientX) * 100 / this.containerOffset.width);
    const offsetYPercen = Number((this.currentAbsoluteMousePoint.y - e.clientY) * 100/ this.containerOffset.height);
    switch (this.stretchDirect) {
      case "e":
        const woffsetE = Number(this.initialRegion.w) - offsetXPercen;
        w = woffsetE > minWidth ? woffsetE : minWidth
        break;
      case "n":
        const hoffsetN = Number(this.initialRegion.h) + offsetYPercen;
        if (hoffsetN > minHeigth) {
          h = Number(this.initialRegion.h) + offsetYPercen;
          t = Number(this.initialRegion.t) - offsetYPercen;;
        }
        break;
      case "s":
        const hoffsetS = Number(this.initialRegion.h) - offsetYPercen;
        if (hoffsetS > minHeigth) {
          h = Number(this.initialRegion.h) - offsetYPercen;
        }
        break;
      case "w":
        const woffsetW = Number(this.initialRegion.w) + offsetXPercen;
        if (woffsetW > minHeigth) {
          w = woffsetW;
          l = Number(this.initialRegion.l) - offsetXPercen
        }
        break;
      case "ne":
        const neoffsetE = Number(this.initialRegion.w) - offsetXPercen;
        w = neoffsetE > minWidth ? neoffsetE : minWidth;
        const neoffsetN = Number(this.initialRegion.h) + offsetYPercen;
        if (neoffsetN > minHeigth) {
          h = Number(this.initialRegion.h) + offsetYPercen;
          t = Number(this.initialRegion.t) - offsetYPercen;;
        }
        break;
      case "nw":
        const nwoffsetW = Number(this.initialRegion.w) + offsetXPercen;
        if (nwoffsetW > minHeigth) {
          w = nwoffsetW;
          l = Number(this.initialRegion.l) - offsetXPercen
        }
       const nwoffsetN = Number(this.initialRegion.h) + offsetYPercen;
        if (nwoffsetN > minHeigth) {
          h = Number(this.initialRegion.h) + offsetYPercen;
          t = Number(this.initialRegion.t) - offsetYPercen;;
        }
        break;
      case "sw":
        const swoffsetS = Number(this.initialRegion.h) - offsetYPercen;
          if (swoffsetS > minHeigth) {
            h = Number(this.initialRegion.h) - offsetYPercen;
          }
        const swoffsetW = Number(this.initialRegion.w) + offsetXPercen;
        if (swoffsetW > minHeigth) {
          w = swoffsetW;
          l = Number(this.initialRegion.l) - offsetXPercen
        }
        break;
      case "se":
        const hoffsetSE = Number(this.initialRegion.h) - offsetYPercen;
        if (hoffsetSE > minHeigth) {
          h = Number(this.initialRegion.h) - offsetYPercen;
        }
        const woffsetSE = Number(this.initialRegion.w) - offsetXPercen;
        w = woffsetSE > minWidth ? woffsetSE : minWidth
        break;
      }
      region.w = w ? w  : region.w;
      region.h = h ? h  : region.h;
      region.t = t ? t  : region.t;
      region.l = l ? l  : region.l;
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
    const offsetXPercen = (cx - px - this.containerOffset.left) * 100 / this.containerOffset.width;
    const offsetYPercen = (cy - py - this.containerOffset.top) * 100 / this.containerOffset.height;
    region.l = Number(this.initialRegion.l) + Number(offsetXPercen);
    region.t = Number(this.initialRegion.t) + Number(offsetYPercen);
    list[index] = region;
    this.setState({
      regionList: list
    })
  }
  
  drawRegion = (index, e) => {
    const list = this.state.regionList;
    const region = list[index];
    if (this.currentMousePoint.x <= e.clientX - this.containerOffset.left) {
      const offset = e.clientX - this.containerOffset.left - this.currentMousePoint.x
      region.w = new Number(offset / (region.containerOffset.width / 100)).toFixed(3);
      
    } else {
      const offsetW = this.currentMousePoint.x + this.containerOffset.left - e.clientX;
      const offsetL = e.clientX - this.containerOffset.left;
      region.w = new Number(offsetW / (region.containerOffset.width / 100)).toFixed(3);
      region.l = new Number(offsetL / (region.containerOffset.width / 100)).toFixed(3);
    }
    if (this.currentMousePoint.y <= e.clientY - this.containerOffset.top) {
      const offsetH = e.clientY - this.currentMousePoint.y - this.containerOffset.top
      region.h = new Number(offsetH / (region.containerOffset.height / 100)).toFixed(3);      
    } else {
      const offsetT = e.clientY - this.containerOffset.top;
      const offsetH = this.containerOffset.top + this.currentMousePoint.y - e.clientY;
      region.t =  new Number(offsetT / (region.containerOffset.height / 100)).toFixed(3);
      region.h =  new Number(offsetH / (region.containerOffset.height / 100)).toFixed(3);
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
  _parsePositionToStyle(position, style) {
    return position.map((p) => {
      if (p.left && p.top) {
        return p;
      }
      let containerOffset = p.containerOffset || {
        width: style.width,
        height: style.height
      };

      return {
        id: position.id,
        label: p.label,
        // left: p.x1,
        // width: p.x2 - p.x1,
        // top: p.y1,
        // height: p.y2 - p.y1,
        l: Number(p.x1 / containerOffset.width),
        w: Number((p.x2 - p.x1) / containerOffset.width),
        t: Number((p.y1) / containerOffset.height),
        h: Number((p.y2 - p.y1) / containerOffset.height),
        containerOffset
      }
    })
  }
  _stypeToPosition(styles) {
    return styles.map((style) => {
      return {
        label: style.label,
        x1: Number(this.state.initialStyle.width * style.l / 100).toFixed(0),
        x2: Number(this.state.initialStyle.width * style.l / 100 + this.state.initialStyle.width * style.w / 100).toFixed(0),
        y1: Number(this.state.initialStyle.height * style.t / 100).toFixed(0),
        y2: Number(this.state.initialStyle.height * style.t / 100 + this.state.initialStyle.height * style.h / 100).toFixed(0),
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
    const list = JSON.parse(JSON.stringify(this.state.regionList));
    const region = list[this.state.activeRegion];
    if (region) {
      const minWidth = Number(this.state.regionMixSize / this.state.initialStyle.width) * 100;
      const minHeigth = Number(this.state.regionMixSize / this.state.initialStyle.height) * 100;
      // console.log("minWidth", minWidth);
      if (region.w < minWidth || region.h < minHeigth) {
        region.w = region.w < minWidth ? minWidth : region.w;
        region.h = region.h < minHeigth ? minHeigth : region.h;
        this.setState({
          regionList: list
        })

      }
      // if (!this._comparePercentage(region.w, minWidth) || !this._comparePercentage(region.h, minHeigth)) {
      //   console.log("minWidth", minWidth);
      //   region.w = !this._comparePercentage(region.w, minWidth) ? minWidth : region.w;
      //   region.h = !this._comparePercentage(region.h, minHeigth) ? minHeigth : region.h;
      //   this.setState({
      //     regionList: list
      //   })
      // }
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
      enlargeCount: targetM,
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
    miniStyle.top = (this.state.initialStyle.top - style.top ) * 100 / style.height + 3 + "%";
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
  _compareRegion(lastList, nextList) {
    if (lastList.length !== nextList.length) {
      return false;
    }
    for (let i = 0; i < lastList.length; i++) {
      if (lastList[i].id !== nextList[i].id) {
        return false;
      }
      if (lastList[i].x1 !== nextList[i].x1 
        || lastList[i].x2 !== nextList[i].x2
        || lastList[i].y1 !== nextList[i].y1
        || lastList[i].y2 !== nextList[i].y2
        ) {
          return false;
      }
      if (!lastList[i].label && nextList[i].label) {
        return false;
      }
      if (lastList[i].label && !nextList[i].label) {
        return false;
      }
      if (lastList[i].label && nextList[i].label) {
        if (lastList[i].label.id !== nextList[i].label.id
          || lastList[i].label.name !== nextList[i].label.name
          ) {
          return false;
        }
      }
    }
    return true;
  }
  _getBoxStyle = (box) => {
    const p = box.getBoundingClientRect();
    return {
      width: p.width,
      height: p.height,
      top: p.top,
      left: p.left
    }
  }
  _updateReionList(propsList, stateList) {
    const list = this._parsePositionToStyle(propsList, this.style).concat([]);
    for (const region of stateList) {
      const stateRegion = list.find((r) => {
        if (r.id === region.id) {
          return true;
        }
        return r.w == region.w && r.h == region.h && r.t == region.t && r.l == region.l;
      });
      if (!stateRegion) {
        list.push(region);
      }
    }
    return list;
  }
  _computePercentage(n, m, symbol) {
    const numN = n.substring(0, n.length - 1);
    const numM = m.substring(0, m.length - 1);
    const r = !symbol ? Number(numN)+ Number(numM) : Number(numN) - Number(numM);
    return Number(r).toFixed(3) +"%";
  }
  _toPercentage(n) {
    return Number(n).toFixed(3) * 100 + "%"
  }
  _comparePercentage(n, m) {
    const numN = n.substring(0, n.length - 1);
    const numM = m.substring(0, m.length - 1);
    return Number(numN) > Number(numM);
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