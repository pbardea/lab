import React from 'react';
import Handle from './handle';

class Graph extends React.Component {
  // Cardinal splines: https://stackoverflow.com/questions/7054272/how-to-draw-smooth-curve-through-n-points-using-javascript-html5-canvas
  // This will probably need to be some canvas.
  createHandles() {
    let handles = [];
    for(var i = 0; i < 10; i++){
      handles.push(<Handle key={i} x={i * 50} />);
    }
    return handles;
  }

  render() {
    return (
      <div
        style={{
          width: 350,
          height: 100,
          backgroundColor: "#ddddee",
          position: "relative",
        }}
      >
          {this.createHandles()}
      </div>
    );
  }
}

export default Graph;
