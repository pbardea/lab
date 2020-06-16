import React from 'react';
import HlcToHex from '../color-conv.js';
import ContrastRatio from '../contrast.js';

class ColorGrid extends React.PureComponent {
    constructor(props) {
        super(props);
        this.handleKeyPress = this.handleKeyPress.bind(this);
    }

    handleKeyPress(event) {
        switch (event.key) {
        case "ArrowUp":
            this.props.onClick(this.props.selected.x, this.props.selected.y-1);
            break;
        case "ArrowDown":
            this.props.onClick(this.props.selected.x, this.props.selected.y+1);
            break;
        case "ArrowLeft":
            this.props.onClick(this.props.selected.x-1, this.props.selected.y);
            break;
        case "ArrowRight":
            this.props.onClick(this.props.selected.x+1, this.props.selected.y);
            break;
        default:
            break;
        }
    }
    render() {
        const yLabels = this.props.yLabels.map((label, i) => {
            return <div style={{width: 50, height: 30}}>{label}</div>;
        });
        const gridDivs = this.props.colors.map((colorSet, i) => {
            const gridCol = colorSet.map((color, j) => {
                var display = HlcToHex(color);
                const selectedColor = HlcToHex(this.props.colors[this.props.selected.x][this.props.selected.y]);
                const isSelected = this.props.selected.x === i && this.props.selected.y === j;
                // This line makes no sense to me.
                display = (isNaN(display) ? display : "#000");
                return (
                    <div
                      onClick={() => this.props.onClick(i, j)}
                      onKeyDown={this.handleKeyPress}
                      tabIndex="-1"
                      key={`${i}${j}`}
                      style={{
                          // TODO: Bring these out to some consts.
                          width: 50,
                          height: 30,
                          // Set the actual color of the cell.
                          backgroundColor: display,
                          // Create the white outline.
                          borderRadius: isSelected ? "5px" : "",
                          boxShadow: isSelected ? "0px 0px 0px 2px #fff" : "",
                          // position being set to relative allows the border to
                          // always be on top.
                          position: isSelected ? "relative" : "",
                          // outline set to none prevents the default blue
                          // highlighting around the initially selected cell.
                          outline:"none",
                          // This flexbox controls the text div inside the cell.
                          display:"flex",
                          alignItems:"center",
                          justifyContent:"center",
                      }}>
                      <div>
                        {isSelected ? ContrastRatio("#FFFFFF", display) : ContrastRatio(display, selectedColor)}
                      </div>
                    </div>
                );
            });
            return <div
                     key={i}
                     >
                     <div>
                       {this.props.xLabels[i]}
                     </div>
                     {gridCol}
                   </div>;
        });

        return (
            <div style={{display: "flex"}}>
              <div>
                <div style={{width:50, height:20}} />
                {yLabels}
              </div>

              {gridDivs}
            </div>
        );
    }
}

export default ColorGrid;
