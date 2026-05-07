
import React from 'react';

type ViewMode = '2d' | '3d';

interface CeilingDrawingProps extends React.SVGProps<SVGSVGElement> {
    length: number;
    width: number;
    panelWidth: number;
    panelHeight: number;
    lineColor?: 'white' | 'white-black' | 'brown';
    borderAlignment?: 'end' | 'center' | 'large-center';
    zoom?: number;
    textureImage?: string | null;
    borderImage?: string | null;
    viewMode?: ViewMode;
    rotation?: { x: number; z: number };
    isDragging?: boolean;
    mainTees?: number;
}
  
export default function CeilingDrawing({ 
    length, 
    width, 
    panelWidth, 
    panelHeight, 
    lineColor = 'white',
    borderAlignment = 'end',
    zoom = 1,
    textureImage = null,
    borderImage = null,
    viewMode = '2d',
    rotation = { x: 50, z: -15 },
    isDragging = false,
    mainTees = 0,
    ...props 
}: CeilingDrawingProps) {
    const totalWidth = width > 0 ? width : 1;
    const totalLength = length > 0 ? length : 1;

    const validPanelWidth = panelWidth > 0 ? panelWidth : totalWidth;
    const validPanelHeight = panelHeight > 0 ? panelHeight : totalLength;
    
    let numCols: number;
    let numRows: number;
    
    const widthHasBorder = totalWidth % validPanelWidth > 0.001;
    const lengthHasBorder = totalLength % validPanelHeight > 0.001;

    if (borderAlignment === 'large-center') {
        numCols = widthHasBorder && totalWidth > validPanelWidth
            ? Math.floor(totalWidth / validPanelWidth) - 1
            : Math.floor(totalWidth / validPanelWidth);

        numRows = lengthHasBorder && totalLength > validPanelHeight
            ? Math.floor(totalLength / validPanelHeight) - 1
            : Math.floor(totalLength / validPanelHeight);

    } else {
        numCols = validPanelWidth > 0 ? Math.floor(totalWidth / validPanelWidth) : 0;
        numRows = validPanelHeight > 0 ? Math.floor(totalLength / validPanelHeight) : 0;
    }
    
    numCols = Math.max(0, numCols);
    numRows = Math.max(0, numRows);

    const griddedWidth = numCols * validPanelWidth;
    const griddedHeight = numRows * validPanelHeight;
    
    let xOffset: number = 0;
    let yOffset: number = 0;

    const isCentered = borderAlignment === 'center' || borderAlignment === 'large-center';
    
    if (isCentered) {
        xOffset = (totalWidth - griddedWidth) / 2;
        yOffset = (totalLength - griddedHeight) / 2;
    }
    
    const lineStrokeWidth = 0.05;
    
    const renderLine = (x1: number, y1: number, x2: number, y2: number, key: string) => {
        const strokeColor = lineColor === 'brown' ? '#8B4513' : 'white';
        const strokeWidth = lineStrokeWidth * 1.5;

        if (lineColor === 'white-black') {
            return (
                <g key={key}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth={lineStrokeWidth * 1.5} />
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="black" strokeWidth={lineStrokeWidth * 0.5} />
                </g>
            );
        }
        return <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} stroke={strokeColor} strokeWidth={strokeWidth} />;
    }

    const renderGridLines = () => {
        if (validPanelWidth <= 0 || validPanelHeight <= 0) return null;
        const lines = [];

        // Vertical lines
        const firstVLinePos = xOffset % validPanelWidth;
        for (let currentX = firstVLinePos; currentX <= totalWidth; currentX += validPanelWidth) {
             if (currentX > 0.01 && currentX < totalWidth - 0.01) {
                lines.push(renderLine(currentX, 0, currentX, totalLength, `v-grid-${currentX}`));
             }
        }
       
        // Horizontal lines
        const firstHLinePos = yOffset % validPanelHeight;
        for (let currentY = firstHLinePos; currentY <= totalLength; currentY += validPanelHeight) {
            if (currentY > 0.01 && currentY < totalLength - 0.01) {
                lines.push(renderLine(0, currentY, totalWidth, currentY, `h-grid-${currentY}`));
            }
        }
        
        return <g>{lines}</g>;
    }
    
    const renderPanels = () => {
        if (!textureImage) return null;

        const panels = [];
        const defs = [];

        for (let j = 0; j < numRows; j++) {
            for (let i = 0; i < numCols; i++) {
                const x = xOffset + i * validPanelWidth;
                const y = yOffset + j * validPanelHeight;
                const patternId = `panel-texture-${i}-${j}`;

                defs.push(
                    <pattern
                        key={patternId}
                        id={patternId}
                        x={x}
                        y={y}
                        width={validPanelWidth}
                        height={validPanelHeight}
                        patternUnits="userSpaceOnUse"
                    >
                        <image href={textureImage} x="0" y="0" width={validPanelWidth} height={validPanelHeight} preserveAspectRatio="xMidYMid slice" />
                    </pattern>
                );

                panels.push(
                    <rect
                        key={`panel-${i}-${j}`}
                        x={x}
                        y={y}
                        width={validPanelWidth}
                        height={validPanelHeight}
                        fill={`url(#${patternId})`}
                    />
                );
            }
        }
        return { defs, panels };
    }

    const renderBorder = () => {
        if (!borderImage) return null;
        const borderRects = [];
        const defs = [];

        // Top and Bottom Borders
        for (let i = 0; i < numCols; i++) {
            const x = xOffset + i * validPanelWidth;
            if (yOffset > 0) { // Top
                const patternId = `border-top-${i}`;
                defs.push(
                    <pattern key={patternId} id={patternId} x={x} y={0} width={validPanelWidth} height={yOffset} patternUnits="userSpaceOnUse">
                        <image href={borderImage} x="0" y="0" width={validPanelWidth} height={yOffset} preserveAspectRatio="xMidYMid slice" />
                    </pattern>
                );
                borderRects.push(<rect key={`border-rect-top-${i}`} x={x} y={0} width={validPanelWidth} height={yOffset} fill={`url(#${patternId})`} />);
            }
            if (totalLength > yOffset + griddedHeight) { // Bottom
                const bottomY = yOffset + griddedHeight;
                const bottomHeight = totalLength - bottomY;
                 const patternId = `border-bottom-${i}`;
                defs.push(
                    <pattern key={patternId} id={patternId} x={x} y={bottomY} width={validPanelWidth} height={bottomHeight} patternUnits="userSpaceOnUse">
                        <image href={borderImage} x="0" y="0" width={validPanelWidth} height={bottomHeight} preserveAspectRatio="xMidYMid slice" />
                    </pattern>
                );
                borderRects.push(<rect key={`border-rect-bottom-${i}`} x={x} y={bottomY} width={validPanelWidth} height={bottomHeight} fill={`url(#${patternId})`} />);
            }
        }

        // Left and Right Borders
        for (let j = 0; j < numRows; j++) {
            const y = yOffset + j * validPanelHeight;
            if (xOffset > 0) { // Left
                 const patternId = `border-left-${j}`;
                defs.push(
                    <pattern key={patternId} id={patternId} x={0} y={y} width={xOffset} height={validPanelHeight} patternUnits="userSpaceOnUse">
                        <image href={borderImage} x="0" y="0" width={xOffset} height={validPanelHeight} preserveAspectRatio="xMidYMid slice" />
                    </pattern>
                );
                borderRects.push(<rect key={`border-rect-left-${j}`} x={0} y={y} width={xOffset} height={validPanelHeight} fill={`url(#${patternId})`} />);
            }
            if (totalWidth > xOffset + griddedWidth) { // Right
                const rightX = xOffset + griddedWidth;
                const rightWidth = totalWidth - rightX;
                 const patternId = `border-right-${j}`;
                defs.push(
                    <pattern key={patternId} id={patternId} x={rightX} y={y} width={rightWidth} height={validPanelHeight} patternUnits="userSpaceOnUse">
                        <image href={borderImage} x="0" y="0" width={rightWidth} height={validPanelHeight} preserveAspectRatio="xMidYMid slice" />
                    </pattern>
                );
                borderRects.push(<rect key={`border-rect-right-${j}`} x={rightX} y={y} width={rightWidth} height={validPanelHeight} fill={`url(#${patternId})`} />);
            }
        }

        // Corners
        if (xOffset > 0 && yOffset > 0) { // Top-left
             const patternId = 'border-corner-tl';
            defs.push(
                <pattern key={patternId} id={patternId} x={0} y={0} width={xOffset} height={yOffset} patternUnits="userSpaceOnUse">
                    <image href={borderImage} x="0" y="0" width={xOffset} height={yOffset} preserveAspectRatio="xMidYMid slice" />
                </pattern>
            );
            borderRects.push(<rect key="corner-tl" x={0} y={0} width={xOffset} height={yOffset} fill={`url(#${patternId})`} />);
        }
        if (xOffset > 0 && totalLength > yOffset + griddedHeight) { // Bottom-left
            const y = yOffset + griddedHeight;
            const height = totalLength - y;
             const patternId = 'border-corner-bl';
            defs.push(
                <pattern key={patternId} id={patternId} x={0} y={y} width={xOffset} height={height} patternUnits="userSpaceOnUse">
                    <image href={borderImage} x="0" y="0" width={xOffset} height={height} preserveAspectRatio="xMidYMid slice" />
                </pattern>
            );
            borderRects.push(<rect key="corner-bl" x={0} y={y} width={xOffset} height={height} fill={`url(#${patternId})`} />);
        }
        if (totalWidth > xOffset + griddedWidth && yOffset > 0) { // Top-right
            const x = xOffset + griddedWidth;
            const width = totalWidth - x;
             const patternId = 'border-corner-tr';
            defs.push(
                <pattern key={patternId} id={patternId} x={x} y={0} width={width} height={yOffset} patternUnits="userSpaceOnUse">
                    <image href={borderImage} x="0" y="0" width={width} height={yOffset} preserveAspectRatio="xMidYMid slice" />
                </pattern>
            );
            borderRects.push(<rect key="corner-tr" x={x} y={0} width={width} height={yOffset} fill={`url(#${patternId})`} />);
        }
        if (totalWidth > xOffset + griddedWidth && totalLength > yOffset + griddedHeight) { // Bottom-right
            const x = xOffset + griddedWidth;
            const y = yOffset + griddedHeight;
            const width = totalWidth - x;
            const height = totalLength - y;
             const patternId = 'border-corner-br';
            defs.push(
                <pattern key={patternId} id={patternId} x={x} y={y} width={width} height={height} patternUnits="userSpaceOnUse">
                    <image href={borderImage} x="0" y="0" width={width} height={height} preserveAspectRatio="xMidYMid slice" />
                </pattern>
            );
            borderRects.push(<rect key="corner-br" x={x} y={y} width={width} height={height} fill={`url(#${patternId})`} />);
        }

        return { defs, borderRects };
    }


    const toFeetInches = (decimalFeet: number): string => {
        if (!decimalFeet || decimalFeet < 0) return `0' 0"`;
        const absoluteFeet = Math.abs(decimalFeet);
        const feet = Math.floor(absoluteFeet);
        const inches = parseFloat(((absoluteFeet - feet) * 12).toFixed(1));

        if (inches === 12) {
            return `${feet + 1}' 0"`;
        }
        
        return `${feet}' ${inches}"`;
    };
    
    const borderStroke = lineColor === 'brown' ? '#8B4513' : 'white';
    
    const svgStyle: React.CSSProperties = {
        transform: `scale(${zoom})`,
        transition: 'transform 0.3s ease',
        width: '100%',
        height: '100%',
        transformOrigin: 'center center',
    };

    if (viewMode === '3d') {
        svgStyle.transform = `scale(${zoom}) perspective(1000px) rotateX(${rotation.x}deg) rotateZ(${rotation.z}deg)`;
        svgStyle.transition = isDragging ? 'none' : 'transform 0.3s ease';
    }

    const remainingWidth = totalWidth - griddedWidth;
    const remainingHeight = totalLength - griddedHeight;
    const panelData = renderPanels();
    const borderData = renderBorder();

    return (
        <div style={svgStyle}>
            <svg
                {...props}
                viewBox={`-2 -2 ${totalWidth + 4} ${totalLength + 4}`}
                preserveAspectRatio="xMidYMid meet"
                className="w-full h-full"
            >
                <defs>
                    {panelData && panelData.defs}
                    {borderData && borderData.defs}
                </defs>

                {/* Main background rect - solid color */}
                <rect
                    x={0}
                    y={0}
                    width={totalWidth}
                    height={totalLength}
                    fill={"hsl(var(--muted))"}
                />
                 
                {/* Render textured panels */}
                {panelData && <g>{panelData.panels}</g>}

                {/* Render textured border */}
                {borderData && <g>{borderData.borderRects}</g>}

                {/* Render the grid lines on top of everything */}
                {renderGridLines()}

                {/* Final perimeter border */}
                <rect
                    x={0}
                    y={0}
                    width={totalWidth}
                    height={totalLength}
                    fill="none"
                    stroke={borderStroke}
                    strokeWidth="0.1"
                />

                {/* Dimension labels */}
                {borderAlignment === 'end' && (
                <>
                    {remainingWidth > 0.001 && (
                        <g>
                            <text 
                                x={griddedWidth + remainingWidth / 2} 
                                y={-0.5} 
                                fontSize="0.4" 
                                textAnchor="middle" 
                                fill="hsl(var(--muted-foreground))"
                            >
                                {toFeetInches(remainingWidth)}
                            </text>
                        </g>
                    )}
                    {remainingHeight > 0.001 && (
                         <g>
                            <text 
                                x={-0.5} 
                                y={griddedHeight + remainingHeight / 2}
                                fontSize="0.4" 
                                textAnchor="middle" 
                                fill="hsl(var(--muted-foreground))"
                                transform={`rotate(-90, -0.5, ${griddedHeight + remainingHeight / 2})`}
                            >
                                {toFeetInches(remainingHeight)}
                            </text>
                        </g>
                    )}
                </>
                )}
                
                <text 
                    x={totalWidth / 2} 
                    y={totalLength + 1} 
                    fontSize="0.5"
                    textAnchor="middle" 
                    fill="hsl(var(--muted-foreground))"
                >
                    {toFeetInches(totalWidth)}
                </text>
                <text 
                    x={totalWidth + 1} 
                    y={totalLength / 2}
                    fontSize="0.5" 
                    textAnchor="middle"
                    fill="hsl(var(--muted-foreground))"
                    dominantBaseline="middle"
                    transform={`rotate(90, ${totalWidth + 1}, ${totalLength/2})`}
                >
                    {toFeetInches(totalLength)}
                </text>

                 <text 
                    x={2}
                    y={totalLength + 1}
                    fontSize="0.5"
                    textAnchor="middle"
                    fill="hsl(var(--muted-foreground))"
                >
                    Main Tees: {mainTees}
                </text>


                {isCentered && xOffset > 0.001 && (
                   <>
                    <text x={xOffset / 2} y={-0.5} fontSize="0.4" textAnchor="middle" fill="hsl(var(--muted-foreground))">
                        {toFeetInches(xOffset)}
                    </text>
                     <text x={totalWidth - (xOffset / 2)} y={-0.5} fontSize="0.4" textAnchor="middle" fill="hsl(var(--muted-foreground))">
                        {toFeetInches(xOffset)}
                    </text>
                   </>
                )}
                {isCentered && yOffset > 0.001 && (
                    <>
                    <text x={-0.5} y={yOffset / 2} fontSize="0.4" textAnchor="middle" fill="hsl(var(--muted-foreground))" transform={`rotate(-90, -0.5, ${yOffset / 2})`}>
                        {toFeetInches(yOffset)}
                    </text>
                     <text x={-0.5} y={totalLength - (yOffset / 2)} fontSize="0.4" textAnchor="middle" fill="hsl(var(--muted-foreground))" transform={`rotate(-90, -0.5, ${totalLength - (yOffset / 2)})`}>
                        {toFeetInches(yOffset)}
                    </text>
                    </>
                )}
            </svg>
        </div>
    );
}
