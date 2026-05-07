
export type MaterialQuantities = {
    ceilingBoards: number;
    mainTees: number;
    crossTees: number;
    wallAngles: number;
    wireKilos: number;
    concreteNails: number;
    rivets: number;
};

type BorderAlignment = 'end' | 'center' | 'large-center';

const MAIN_TEE_LENGTH = 12;
const CROSS_TEE_STANDARD_LENGTH = 2;
const WALL_ANGLE_LENGTH = 10;

export function calculateMaterials(
    totalLength: number,
    totalWidth: number,
    panelWidth: number,
    panelHeight: number,
    borderAlignment: BorderAlignment = 'end'
): MaterialQuantities {
    if (totalLength <= 0 || totalWidth <= 0 || panelWidth <= 0 || panelHeight <= 0) {
        return {
            ceilingBoards: 0,
            mainTees: 0,
            crossTees: 0,
            wallAngles: 0,
            wireKilos: 0,
            concreteNails: 0,
            rivets: 0,
        };
    }

    // --- Main Tee Calculation ---
    let mainTeeRuns = Math.floor(totalWidth / panelWidth);
    
    // If the boards don't fit perfectly, you need one less tee than the number of boards across.
    if (totalWidth % panelWidth > 0.001) {
        mainTeeRuns = Math.ceil(totalWidth / panelWidth) - 1;
    } else {
        // If they fit perfectly, you still need one less tee run.
        mainTeeRuns = Math.max(0, mainTeeRuns - 1);
    }

    // Special Case: When centering, an extra tee run is needed to create the second border.
    if (borderAlignment === 'center' && totalWidth % panelWidth > 0.001) {
        mainTeeRuns += 1;
    }
    
    mainTeeRuns = Math.max(0, mainTeeRuns);
    
    const totalMainTeeLength = mainTeeRuns * totalLength;
    const mainTees = Math.ceil(totalMainTeeLength / MAIN_TEE_LENGTH);


    // --- Ceiling Boards (Detailed Calculation) ---
    let numFullCols, numFullRows;
    if (borderAlignment === 'large-center') {
      numFullCols = Math.max(0, Math.floor(totalWidth / panelWidth) - 1);
      numFullRows = Math.max(0, Math.floor(totalLength / panelHeight) - 1);
    } else {
      numFullCols = Math.max(0, Math.floor(totalWidth / panelWidth));
      numFullRows = Math.max(0, Math.floor(totalLength / panelHeight));
    }
    const fullPanels = numFullCols * numFullRows;

    let smallBorderCellCount = 0;
    let largeBorderCellCount = 0;
    
    // Calculate border cells
    const griddedWidth = numFullCols * panelWidth;
    const griddedHeight = numFullRows * panelHeight;
    const widthHasBorder = totalWidth > griddedWidth;
    const lengthHasBorder = totalLength > griddedHeight;

    if (widthHasBorder || lengthHasBorder) {
        let xOffset = 0;
        let yOffset = 0;
        if (borderAlignment === 'center' || borderAlignment === 'large-center') {
            xOffset = (totalWidth - griddedWidth) / 2;
            yOffset = (totalLength - griddedHeight) / 2;
        } else { // 'end'
             xOffset = totalWidth - griddedWidth;
             yOffset = totalLength - griddedHeight;
        }
        
        const checkCell = (w: number, h: number) => {
            if (w > 0.001 && h > 0.001) {
                if (w <= 1 || h <= 1) { // If either dimension is 1ft or less
                    smallBorderCellCount++;
                } else {
                    largeBorderCellCount++;
                }
            }
        };

        const sideBorderW = xOffset;
        const topBorderH = yOffset;

        if(borderAlignment === 'end') {
            if(xOffset > 0.001) for(let i = 0; i < numFullRows; i++) checkCell(xOffset, panelHeight); // Right border
            if(yOffset > 0.001) for(let i = 0; i < numFullCols; i++) checkCell(panelWidth, yOffset); // Bottom border
            if(xOffset > 0.001 && yOffset > 0.001) checkCell(xOffset, yOffset); // Corner
        } else { // 'center' or 'large-center'
            if (sideBorderW > 0.001) {
                 for(let i = 0; i < numFullRows; i++) {
                    checkCell(sideBorderW, panelHeight); // Left
                    checkCell(sideBorderW, panelHeight); // Right
                 }
            }
            if (topBorderH > 0.001) {
                for(let i = 0; i < numFullCols; i++) {
                    checkCell(panelWidth, topBorderH); // Top
                    checkCell(panelWidth, topBorderH); // Bottom
                }
            }
            if (sideBorderW > 0.001 && topBorderH > 0.001) {
                 checkCell(sideBorderW, topBorderH); // TL
                 checkCell(sideBorderW, topBorderH); // TR
                 checkCell(sideBorderW, topBorderH); // BL
                 checkCell(sideBorderW, topBorderH); // BR
            }
        }
    }
    
    // For every 2 small cells, we need one board.
    const smallBorderBoards = Math.ceil(smallBorderCellCount / 2);
    // For every large cell, we need one board.
    const ceilingBoards = fullPanels + smallBorderBoards + largeBorderCellCount;

    // --- Cross Tee Calculation ---
    let numCrossTeeRuns;
    if (borderAlignment === 'center') {
        numCrossTeeRuns = Math.ceil(totalLength / panelHeight);
    } else { // 'end' and 'large-center'
        numCrossTeeRuns = Math.ceil(totalLength / panelHeight) - 1;
    }
    numCrossTeeRuns = Math.max(0, numCrossTeeRuns);

    const crossTeesPerRun = Math.ceil(totalWidth / panelWidth);
    const totalCrossTees = numCrossTeeRuns * crossTeesPerRun;

    
    // --- Other Materials ---
    const perimeter = 2 * (totalLength + totalWidth);
    const area = totalLength * totalWidth;
    
    const wallAngles = Math.ceil(perimeter / WALL_ANGLE_LENGTH);
    const wireKilos = parseFloat((area / 100).toFixed(2));
    const concreteNails = Math.ceil(perimeter * 1.5);
    const rivets = 0;

    return {
        ceilingBoards: Math.max(0, ceilingBoards),
        mainTees: Math.max(0, mainTees),
        crossTees: Math.ceil(totalCrossTees),
        wallAngles: Math.max(0, wallAngles),
        wireKilos: Math.max(0, wireKilos),
        concreteNails: Math.max(0, concreteNails),
        rivets: Math.max(0, rivets)
    };
}
