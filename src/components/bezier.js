import React from 'react';
import HLCToHex from '../color-conv.js';
import SVGPath from '../bezier.js';
import GetInvalidRegions from '../region.js';

// BezierGraph graphs a set of given points on a plot and connects them with an
// interactive Bezier curve.
class BezierGraph extends React.PureComponent {
    constructor(props) {
        super(props);

        const points = this.props.colors[this.props.selectedColor].map((color, i) => {
            const yRelPos = 1 - (color[this.props.comp]/this.props.maxCompValue);
            const yPos = yRelPos * this.props.viewBoxHeight;
            return {x: this.xPos(i), y: yPos};
        });

        this.state = {
            points: points,

            dragPointIdxs: [],
            dragPointIdx: null,
        };
        this.points = this.points.bind(this);
        this.lastYPos = null;
    }

    handleMouseDown(pointIdx) {
        this.setState({ dragPointIdx: pointIdx });
    }

    handleMouseUp() {
        this.setState({ dragPointIdx: null, dragPointIdxs: [] });
    }

    handleLineMouseDown() {
        var allPoints = [];
        for (var i = 0; i < this.points().length; i++) {
            allPoints.push(i);
        }

        this.setState({ dragPointIdxs: allPoints });
    }

    handleMouseMove({ clientX, clientY, shiftKey }) {
        const { viewBoxHeight } = this.props;
        const { dragPointIdx, dragPointIdxs } = this.state;

        const points = dragPointIdx === null ? dragPointIdxs : [dragPointIdx];
        if (points.length === 0) {
            this.lastYPos = null;
            return;
        }

        const svgRect = this.node.getBoundingClientRect();
        const svgY = clientY - svgRect.top;

        const yRelPos = Math.max(Math.min(svgY / svgRect.height, 1.0), 0.0);
        const yDiff = this.lastYPos === null ? 0 : yRelPos - this.lastYPos;
        // allowIntoMorder allows the user to drag the knobs into the forbidden region.
        const allowIntoMordor = false;

        let didUpdate = false;
        if (points.length === 1) {
            this.props.colorFunc(1 - yRelPos, points[0], allowIntoMordor, HLCToHex);
        } else {
            points.forEach((dragPointIdx) => {
                const curYPos = this.points()[dragPointIdx].y;
                const curYRelPos = curYPos / (1.0 * viewBoxHeight);
                if (shiftKey) {
                    // If the shift key is pressed, then move all the points along
                    // with the cursor.
                    const didUpdatePoint = this.props.colorFunc(1-yRelPos, dragPointIdx, allowIntoMordor, HLCToHex);
                    if (didUpdatePoint) { didUpdate = true; }
                } else {
                    // Otherwise, move the positions of all the points relative to
                    // their last point. This only makes a difference from the above
                    // case when moving multiple points.
                    const didUpdatePoint =this.props.colorFunc(1 - curYRelPos - yDiff, dragPointIdx, allowIntoMordor, HLCToHex);
                    if (didUpdatePoint) { didUpdate = true; }
                }
            });
            if (didUpdate) {
                // If any of the points updated, update
                // the lastYPos for relative line movement.
                this.lastYPos = yRelPos;
            }
        }
    }

    xPos(xIdx) {
        const spacing = this.props.viewBoxWidth / this.props.colors[this.props.selectedColor].length;
        return spacing/2 + xIdx * spacing;
    }

    points() {
        return this.props.colors[this.props.selectedColor].map((color, i) => {
            const yRelPos = 1 - (color[this.props.comp]/this.props.maxCompValue);
            const yPos = yRelPos * this.props.viewBoxHeight;
            return {x: this.xPos(i), y: yPos};
        });
    }

    render() {
        const { viewBoxWidth, viewBoxHeight } = this.props;

        const handles = this.points().map((point, i) => (
                <SliderHandle
            key={i}
            coordinates={point}
            isHighlighted={this.props.otherSelectedColor === i}
            color={HLCToHex(this.props.colors[this.props.selectedColor][i])}
            onMouseDown={() => this.handleMouseDown(i)}
                />
        ));

        const gradStops = this.points().map((point, i) => (
                <stop key={i} offset={`${i*11}%`}   stopColor={HLCToHex(this.props.colors[this.props.selectedColor][i])}/>
        ));

        const gradName = `linear-${this.props.name}-${this.props.column}`;

        const colorPreview = this.props.colors[this.props.selectedColor].map((color, i) => {
            return <div style={{backgroundColor: HLCToHex(color), height: "3px", width: "100px"}} />;
        });

        const labels = this.props.colors[this.props.selectedColor].map((color, i) => {
            const value = color[this.props.comp] * this.props.maxVisibleCompValue / this.props.maxCompValue;
            return <p style={{height: "10px"}} key={i}>{value.toFixed(1)}</p>;
        });

        const xConv = (xRelPos) => {
            return this.xPos(xRelPos);
        };

        const yConv = (yRelPos) => {
            return yRelPos * this.props.viewBoxHeight;
        };

        const invalidRegions = GetInvalidRegions(this.props.colors[this.props.selectedColor], (color, curPos) => {
            const newColor = Object.assign({}, color);
            newColor[this.props.comp] = curPos * this.props.maxCompValue;
            return newColor;
        }, xConv, yConv);
        const closedRegions = invalidRegions.map((region, i) => {
            return <path key={i} d={SVGPath(region)} fill="url(#diagonalHatch)" stroke="rgb(218, 222, 227)" strokeWidth={0.5} />;
        });

        return (
            <div>
                <h3>{this.props.name}</h3>
                <div style={{
                    display: 'flex',
                    flexWrap: 'nowrap',
                    justifyContent: 'space-around',
                }}>
                {colorPreview}
                </div>
                <div style={{
                    display: 'flex',
                    flexWrap: 'nowrap',
                    justifyContent: 'space-around',
                    backgroundColor: 'rgb(248, 250, 252)'
                }}>
                {labels}
                </div>
                <svg
            ref={node => (this.node = node)}
            id="picker"
            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
            onMouseMove={ev => this.handleMouseMove(ev)}
            onMouseUp={() => this.handleMouseUp()}
            onMouseLeave={() => this.handleMouseUp()}
            style={{
                width: '100%',
                border: '1px solid',
                color: 'rgb(203, 214, 223)',
                backgroundColor: 'rgb(248,250,252)',
            }}
                >

                <defs>
                <pattern id="diagonalHatch" width="3" height="3" patternTransform="rotate(75 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="10" style={{
                    stroke:"rgb(218, 222, 227)",
                    strokeWidth:2
                }}/>
                </pattern>
                <linearGradient id={gradName}>
                {gradStops}
            </linearGradient>
                </defs>

                {closedRegions}
                <path d={SVGPath(this.points())} fill="none" stroke={`url(#${gradName})`} strokeWidth={5} onMouseDown={() => this.handleLineMouseDown()}/>

                {handles}

            </svg>
                </div>
        );
    }
}

const SliderHandle = ({ coordinates, onMouseDown, color, isHighlighted }) => (
    <g>
        <ellipse
    cx={coordinates.x}
    cy={coordinates.y}
    rx={isHighlighted ? 5.1 : 5}
    ry={isHighlighted ? 5.1 : 5}
    fill="rgb(240,240,240)"
    stroke={color}
    strokeWidth={isHighlighted ? 1.5 : 0.6}
    onMouseDown={onMouseDown}
    style={{ cursor: '-webkit-grab' }}
        />
        <ellipse
    cx={coordinates.x}
    cy={coordinates.y}
    rx={3.5}
    ry={3.5}
    fill={color}
    onMouseDown={onMouseDown}
    style={{ cursor: '-webkit-grab' }}
        />
        </g>
);

export default BezierGraph;
