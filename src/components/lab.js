import React from 'react';
import BezierGraph from './bezier';
import ColorGrid from './color-grid';
import update from 'immutability-helper';
import ls from 'local-storage';

const transpose = m => m[0].map((x,i) => m.map(x => x[i]));

const lTransform = (color, value) => {
    return {l: value * 100, h: color.h, c: color.c};
};

const cTransform = (color, value) => {
    return {l: color.l, h: color.h, c: value * 100};
};

const hTransform = (color, value) => {
    return {l: color.l, h: 2 * Math.PI * value, c: color.c};
};

const defaultColors = () => {
    const numHues = 10;
    const numLightness = 9;
    var colors = [];
    for (var i = 0; i < numHues; i++) {
        const curSet = [];
        for (var j = 0; j < numLightness; j++) {
            curSet.push({h: j / 10.0 * Math.PI * 2 + i/200.0, c: 28+i/10.0+j/200.0, l: 80-i*3+j/200.0});
        }
        colors.push(curSet);
    }
    return colors;
};

const COLOR_KEY='colors';
const SELECTED_KEY='selected-color';
const CHART_WIDTH = 450;
const CHART_HEIGHT = 150;


class Lab extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            colors: ls.get(COLOR_KEY) || defaultColors(),
            selectedColor: ls.get(SELECTED_KEY) || {x: 0, y: 0},
        };

        // We need this so that selectionChange can refer to this.state.
        this.selectionChange = this.selectionChange.bind(this);
    }

    // colorControlFactory... is too complicated.
    colorControlFactory(colorTransform, isVertical) {
        return (value, i, allowIntoMordor, colorRender) => {
            const xPos = isVertical ? this.state.selectedColor.x : i;
            const yPos = isVertical ? i : this.state.selectedColor.y;
            const existingColors = this.state.colors;
            const baseColor = this.state.colors[xPos][yPos];
            const newColor = colorTransform(baseColor, value);
            if (colorRender(newColor) === "" && !allowIntoMordor) {
                return false;
            }
            this.setState(update(this.state, {
                colors: {
                    [xPos] : {
                        [yPos]: {
                            $set: newColor
                        }
                    }
                },
            }));
            existingColors[xPos][yPos] = newColor;
            ls.set(COLOR_KEY, existingColors);
            return true;
        };
    }

    // selectionChange is a callback that updates the selectiono of the state.
    selectionChange(i, j) {
        const isOutOfBounds = i < 0 || j < 0 || i >= this.state.colors.length || j >= this.state.colors[0].length;
        if (isOutOfBounds) { return; }
        this.setState({selectedColor: {x: i, y: j}});
        ls.set(SELECTED_KEY, {x: i, y: j});
    }

    render() {
        const propSpecs = {
            "lightness": {
                name: "Lightness",
                max: 100,
                maxVisible: 100,
                comp: "l",
                transform: lTransform,
            },
            "chroma": {
                name: "Chroma",
                max: 100,
                maxVisible: 100,
                comp: "c",
                transform: cTransform,
            },
            "hue": {
                name: "Hue",
                max: 2 * Math.PI,
                maxVisible: 360,
                comp: "h",
                transform: hTransform,
            },
        };

        const makeChart = (propSpec, isVerticalAxis) => {
            return (
                <div style={{width: CHART_WIDTH, height: CHART_HEIGHT + 100}}>
                  <BezierGraph
                    viewBoxWidth={CHART_WIDTH}
                    viewBoxHeight={CHART_HEIGHT}
                    colorFunc={this.colorControlFactory(propSpec.transform, isVerticalAxis)}
                    name={propSpec.name}
                    comp={propSpec.comp}
                    column={isVerticalAxis}
                    colors={isVerticalAxis ? this.state.colors : transpose(this.state.colors)}
                    selectedColor={isVerticalAxis ? this.state.selectedColor.x : this.state.selectedColor.y}
                    otherSelectedColor={isVerticalAxis ? this.state.selectedColor.y : this.state.selectedColor.x}
                    maxCompValue={propSpec.max}
                    maxVisibleCompValue={propSpec.maxVisible}
                  />
                </div>
            );
        };

        const makeChartColumn = (isVerticalAxis) => {
            const charts = Object.keys(propSpecs).map((propKey) => {
                return makeChart(propSpecs[propKey], isVerticalAxis);
            });
            return <div style={{padding: "10px"}}> {charts} </div>;
        };

        const makeLab = () => {
            const columns = [false, true].map((isVerticalAxis) => {
                return makeChartColumn(isVerticalAxis);
            });
            return (
                <div style={{display: "flex", justifyContent: "left"}}>
                  <ColorGrid
                    colors={this.state.colors}
                    xLabels={[50, 100, 200, 300, 400, 500, 600, 700, 800, 900]}
                    yLabels={["Gray", "Blue", "Cyan", "Green", "Yellow", "Orange", "Red", "Purple", "Violet"]}
                    onClick={this.selectionChange}
                    selected={this.state.selectedColor}
                  />
                  {columns}
                </div>
            );
        };

        return makeLab();
    }
}

export default Lab;
