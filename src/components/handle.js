import React from 'react';
import Draggable from 'react-draggable';

class Handle extends React.Component {
  state = {
    deltaPosition: {
      x: 0, y: 0
    },
    color: {
      r: 0,
      g: 0,
      b: 0,
    }
  };

  handleDrag = (e, ui) => {
    const {x, y} = this.state.deltaPosition;
    this.setState({
      deltaPosition: {
        x: x,
        y: y + ui.deltaY,
      },
    });
    this.setState({
      color: {
        r: Math.round(Math.abs(this.state.deltaPosition.y / 500) * 255),
        g: 0,
        b: 0,
      },
    });
  };

  render() {
    return (
      <Draggable
        axis="y"
        defaultPosition={{x: 0, y: 0}}
        onDrag={this.handleDrag}
        bounds="parent" >
        <div style={{width: 10}}>
          <Circle key="1" color={this.state.color} />
        </div>
      </Draggable>
    );
  }
}

function componentToHex (c) {
  var hex = c.toString(16);
  return hex.length === 1 ? "0" + hex : hex;
};

function rgbToHex(color) {
  return "#" + componentToHex(color.r) + componentToHex(color.g) + componentToHex(color.b);
}

class Circle extends React.Component {
  render() {
      var circleStyle = {
        padding:0,
        margin:0,
        display:"inline-block",
        backgroundColor: rgbToHex(this.props.color),
        borderRadius: "50%",
        width:10,
        height:10,
      };
      return (
        <div style={circleStyle}>
        </div>
      );
  }
}

export default Handle;
