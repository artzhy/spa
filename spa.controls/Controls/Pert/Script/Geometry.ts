module spa.controls {
    export class Geometry {

        // #region Point test

        public static circleContainsPoint(circle: number[], point: number[]): boolean {
            return Geometry.lineLength([circle[0], circle[1], point[0], point[1]]) <= circle[2];
        }

        public static polygonContainsPoint(polygon: number[][], point: number[]): boolean {
            var rect = Geometry.polygonBoundingRectangle(polygon);

            if (Geometry.rectangleContainsPoint(rect, point) == false) {
                return false;
            }

            for (var c = false, i = -1, l = polygon.length, j = l - 1; ++i < l; j = i) {
                ((polygon[i][1] <= point[1] && point[1] < polygon[j][1]) || (polygon[j][1] <= point[1] && point[1] < polygon[i][1]))
                && (point[0] < (polygon[j][0] - polygon[i][0]) * (point[1] - polygon[i][1]) / (polygon[j][1] - polygon[i][1]) + polygon[i][0])
                && (c = !c);
            }

            return c;
        }

        public static rectangleContainsPoint(rectangle: number[], point: number[]): boolean {
            return (point[0] >= rectangle[0])
                && (point[0] <= rectangle[0] + rectangle[2])
                && (point[1] >= rectangle[1])
                && (point[1] <= rectangle[1] + rectangle[3]);
        }

        // #endregion

        // #region Intersection test

        public static circleIntersectsLine(circle: number[], line: number[]): boolean {
            // compute the euclidean distance between A and B
            var lab = Geometry.lineLength(line);

            // compute the direction vector D from A to B
            var dx = (line[2] - line[0]) / lab;
            var dy = (line[3] - line[1]) / lab;

            // compute the value t of the closest point to the circle center (Cx, Cy)
            var t = dx * (circle[0] - line[0]) + dy * (circle[1] - line[1]);

            // compute the coordinates of the point E on line and closest to C
            var ex = t * dx + line[0];
            var ey = t * dy + line[1];

            // compute the euclidean distance from E to C
            var lec = Math.sqrt(Math.pow(ex - circle[0], 2) + Math.pow(ey - circle[1], 2));

            // test if the line intersects the circle
            return lec < circle[2];
        }

        public static circleIntersectsRectangle(circle: number[], rect: number[]): boolean {
            var rectX = rect[0] + rect[2] / 2;
            var rectY = rect[1] + rect[3] / 2;

            var circleDistanceX = Math.abs(circle[0] - rectX);
            var circleDistanceY = Math.abs(circle[1] - rectY);

            if (circleDistanceX > (rect[2] / 2 + circle[2])) { return false; }
            if (circleDistanceY > (rect[3] / 2 + circle[2])) { return false; }

            if (circleDistanceX <= (rect[2] / 2)) { return true; }
            if (circleDistanceY <= (rect[3] / 2)) { return true; }

            var cornerDistance_sq = Math.pow((circleDistanceX - rect[2] / 2), 2) + Math.pow((circleDistanceY - rect[3] / 2), 2);

            return (cornerDistance_sq <= (Math.pow(circle[2], 2)));
            //return cornerDistance_sq <= Math.pow(circle[2], 2);
        }

        public static lineIntersectsLine(line1: number[], line2: number[]): boolean {
            var denominator = ((line2[3] - line2[1]) * (line1[2] - line1[0])) - ((line2[2] - line2[0]) * (line1[3] - line1[1]));

            if (denominator == 0) {
                return false;
            }

            var ua = (line2[2] - line2[0]) * (line1[1] - line2[1]) - (line2[3] - line2[1]) * (line1[0] - line2[0]);
            var ub = (line1[2] - line1[0]) * (line1[1] - line2[1]) - (line1[3] - line1[1]) * (line1[0] - line2[0]);

            if (denominator != 0) {
                ua = ua / denominator;
                ub = ub / denominator;
            }

            return (ua > 0 && ua < 1) && (ub > 0 && ub < 1);
        }

        public static polygonIntersectsRectangle(polygon: number[][], rect: number[]): boolean {
            var polygonBounds = this.polygonBoundingRectangle(polygon);

            if (Geometry.rectangleIntersectsRectangle(polygonBounds, rect)) {

                return Geometry.polygonIntersectsPolygon(polygon,
                    [
                        [rect[0], rect[1]],
                        [rect[0] + rect[2], rect[1]],
                        [rect[0] + rect[2], rect[1] + rect[3]],
                        [rect[0], rect[1] + rect[3]]
                    ]);
            }

            return false;
        }

        public static polygonIntersectsPolygon(polygon1: number[][], polygon2: number[][]): boolean {
            var lines1 = Geometry.getPolygonLines(polygon1);
            var lines2 = Geometry.getPolygonLines(polygon2);

            for (var i = 0; i < lines1.length; i++) {
                for (var j = 0; j < lines2.length; j++) {
                    if (Geometry.lineIntersectsLine(lines1[i], lines2[j])) {
                        return true;
                    }
                }
            }

            return Geometry.polygonContainsPoint(polygon1, polygon2[0]) || Geometry.polygonContainsPoint(polygon2, polygon1[1]);
        }

        public static rectangleIntersectsRectangle(rect1: number[], rect2: number[]): boolean {
            return !(
                (rect1[1] + rect1[3] < rect2[1]) ||
                (rect1[1] > rect2[1] + rect2[3]) ||
                (rect1[0] > rect2[0] + rect2[2]) ||
                (rect1[0] + rect1[2] < rect2[0])
                );
        }

        // #endregion

        // #region Transformation

        public static inflateRectangle(rect: number[], width: number, height: number): number[] {
            return [rect[0] - width, rect[1] - height, rect[2] + width * 2, rect[3] + height * 2];
        }

        public static movePoint(point: number[], targetPoint: number[], distance: number): number[] {
            var length = Geometry.lineLength([point[0], point[1], targetPoint[0], targetPoint[1]]);

            if (distance > length) {
                return point;
            }

            if (point[0] == targetPoint[0]) {
                return point[1] > targetPoint[1] ? [point[0], point[1] - distance] : [point[0], point[1] + distance];
            } else {
                if (point[1] == targetPoint[1]) {
                    return point[0] > targetPoint[0] ? [point[0] - distance, point[1]] : [point[0] + distance, point[1]];
                } else {
                    return [point[0] + (targetPoint[0] - point[0]) * distance / length, point[1] + (targetPoint[1] - point[1]) * distance / length];
                }
            }
        }

        public static rotatePoint(point: number[], origin: number[], angle: number): number[] {
            if (angle == 0) {
                return point;
            }

            var radAngle = angle * (Math.PI / 180.0);

            var cos = Math.cos(radAngle);
            var sin = Math.sin(radAngle);

            var x = cos * (point[0] - origin[0]) - sin * (point[1] - origin[1]) + origin[0];
            var y = sin * (point[0] - origin[0]) + cos * (point[1] - origin[1]) + origin[1];

            return [x, y];
        }

        public static rotatePolygon(polygon: number[][], origin: number[], angle: number): number[][] {
            var radAngle = angle * (Math.PI / 180.0);

            var cos = Math.cos(radAngle);
            var sin = Math.sin(radAngle);

            var points: number[][] = [];

            for (var i = 0; i < polygon.length; i++) {
                var x = cos * (polygon[i][0] - origin[0]) - sin * (polygon[i][1] - origin[1]) + origin[0];
                var y = sin * (polygon[i][0] - origin[0]) + cos * (polygon[i][1] - origin[1]) + origin[1];

                points.push([x, y]);
            }

            return points;
        }

        public static rotateRectangle(rectangle: number[], origin: number[], angle: number): number[][] {
            var polygon = [
                [rectangle[0], rectangle[1]],
                [rectangle[0] + rectangle[2], rectangle[1]],
                [rectangle[0] + rectangle[2], rectangle[1] + rectangle[3]],
                [rectangle[0], rectangle[1] + rectangle[3]]
            ];

            if (angle != 0) {
                return Geometry.rotatePolygon(polygon, origin, angle);
            }
            else {
                return polygon;
            }
        }

        public static translatePolygon(polygon: number[][], x: number, y: number): number[][] {
            var points: number[][] = [];

            for (var i = 0; i < polygon.length; i++) {
                points.push([polygon[i][0] + x, polygon[i][1] + y]);
            }

            return points;
        }

        public static translateRectangle(rect: number[], x: number, y: number): number[] {
            return [
                rect[0] + x,
                rect[1] + y,
                rect[2],
                rect[3]
            ];
        }

        public static unionRectangle(rect1: number[], rect2: number[]): number[] {
            var left = Math.min(rect1[0], rect2[0]);
            var top = Math.min(rect1[1], rect2[1]);
            var right = Math.max(rect1[0] + rect1[2], rect2[0] + rect2[2]);
            var bottom = Math.max(rect1[1] + rect1[3], rect2[1] + rect2[3]);

            return [left, top, right - left, bottom - top];
        }

        // #endregion

        // #region Helpers

        public static getPolygonLines(polygon: number[][]): number[][] {
            var lines: number[][] = [];

            for (var i = 0; i < polygon.length; i++) {
                if (i == polygon.length - 1) {
                    lines.push([polygon[i][0], polygon[i][1], polygon[0][0], polygon[0][1]]);
                }
                else {
                    lines.push([polygon[i][0], polygon[i][1], polygon[i + 1][0], polygon[i + 1][1]]);
                }
            }

            return lines;
        }

        public static getRectangleFromPoints(point1: number[], point2: number[]): number[] {
            var left = Math.min(point1[0], point2[0]);
            var top = Math.min(point1[1], point2[1]);
            var right = Math.max(point1[0], point2[0]);
            var bottom = Math.max(point1[1], point2[1]);

            return [left, top, right - left, bottom - top];
        }

        public static lineAngle(line: number[]): number {
            if (line[1] == line[3]) {
                if (line[0] > line[2]) {
                    return 180;
                }
                else {
                    return 0;
                }
            }
            else {
                return Math.atan2(line[3] - line[1], line[2] - line[0]) * 180 / Math.PI;
            }
        }

        public static lineLength(line: number[]): number {
            if (line[0] == line[2]) {
                return Math.abs(line[3] - line[1]);
            }
            else {
                if (line[1] == line[3]) {
                    return Math.abs(line[2] - line[0]);
                } else {
                    return Math.ceil(Math.sqrt(Math.pow(line[2] - line[0], 2) + Math.pow(line[3] - line[1], 2)));
                }
            }
        }

        public static polygonBoundingRectangle(polygon: number[][]): number[] {
            var left = polygon[0][0];
            var top = polygon[0][1];
            var right = left;
            var bottom = top;

            for (var i = 0; i < polygon.length; i++) {
                left = Math.min(left, polygon[i][0]);
                top = Math.min(top, polygon[i][1]);
                right = Math.max(right, polygon[i][0]);
                bottom = Math.max(bottom, polygon[i][1]);
            }

            return [left, top, right - left, bottom - top];
        }


        // #endregion
    }
}