//
// balance_game.js
// (Written in ES2015(ES6))
//
// Last update: Tue Mar  8 18:04:43 JST 2022
//

let canvas, context, world;
const scale = 10; // HTMLファイル中で指定した canvas のサイズは 600x600．一方，以下では 60x60 の空間を前提としているため scale は 10 となる
const bodyDef = new Box2D.Dynamics.b2BodyDef;
const fixDef = new Box2D.Dynamics.b2FixtureDef;
const b2Vec2 = Box2D.Common.Math.b2Vec2;
const blocks = new Array();
let selectBlock = null;
let bar, length = 30;

const init = () => {
    // キャンバスの取得
    canvas = document.getElementById("world");
    context = canvas.getContext("2d");

    // 重力加速度の設定，形状の定義
    world = new Box2D.Dynamics.b2World(new b2Vec2(0,9.8), true);
    fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape;
    // 密度，摩擦係数，反発係数をセット
    [fixDef.density, fixDef.friction, fixDef.restitution] = [1, 0.5, 0.1];
    // 地面，壁，シーソーの支点 を配置
    setBox(30, 60, 30, 1); // (30,60) を中心とする 幅30 高さ1の箱（床）を配置
    setBox(0, 30, 1, 30);  // (0, 30) を中心とする 幅1 高さ30の箱（左壁）を配置
    setBox(60, 30, 1, 30); // (60,30) を中心とする 幅1 高さ30の箱（右壁）を配置
    setBox(30, 35, 1, 1);  // (30,35) を中心とする 幅1 高さ1の箱（支点）を配置
    // シーソー を配置
    bar = setBox(30, 30, length / 2, 1, Box2D.Dynamics.b2Body.b2_dynamicBody);
    // ブロックの配置（6,5,4,3角形を各10個）
    for (let i = 0; i < 40; i++) {
	const n = 6 - Math.floor(i / 10); // n = 6,5,4,3
	const [x, y] = [(i - Math.floor(i / 10) * 10) * 6 + 3, 55 - Math.floor(i / 10) * 5];
	blocks.push({"obj":setPolygon(x, y, n), "n":n});
    }

    // マウスイベントの登録 // ブロックを積む
    document.addEventListener('mousedown', (event) => {
	const [x, y] = getPoint(event);
	if (selectBlock == null) {
	    // ブロックを選択
	    let min = 60; // マウスポインタの位置とn角形のブロックとの距離がこの値より大きかったら対象となる当該ブロック中にはいないと判断する
	    for (const block of blocks) {
		// マウスポインタと現在着目しているブロックの距離を算出
		const pos = block.obj.GetPosition();
		const d = ((x - pos.x) ** 2 + (y - pos.y) ** 2) ** 0.5;
		if ((d < (block.n / 2)) && (d < min)) { // block.n : 当該ブロックが何角形かを示す
		    // 最小の d とその d をもたらしたブロックを selectBlock に記録
		    selectBlock = block.obj;
		    min = d;
		}
	    }
	    // マウスポインタが位置するブロックが見つかったので当該ブロックをマウスポインタの位置に移動する
	    if (selectBlock != null) {
		selectBlock.SetPosition(new b2Vec2(x, y));
	    }
	}
    });

    // マウスイベントの登録 // マウスポインタの位置にブロックを動かす
    document.addEventListener('mousemove', (event) => {
	const [x, y] = getPoint(event);
	if (selectBlock != null) {
	    selectBlock.SetAwake(false);
	    selectBlock.SetPosition(new b2Vec2(x, y));
	}
    });

    // マウスイベントの登録 // ブロックを画面中央にワープさせて落下させる
    document.addEventListener('mouseup', (event) => {
	const [x, y] = getPoint(event);
	if (selectBlock != null) {
	    // ブロックを掴んでいてマウスポインタが壁と床で囲われている範囲外なら，ブロックを (30,40) にワープ?させて落下させる
	    if ((x < 0) || (x > 60) || (y > 60)) {
		selectBlock.SetPosition(new b2Vec2(30, 40));
	    }
	    selectBlock.SetAwake(true);
	    selectBlock = null;
	}
    });

    // ゲーム開始
    setInterval(update, 1000 / 60);
}

const setBox = (x, y, w, h, type = Box2D.Dynamics.b2Body.b2_staticBody) => {
    // 四角形の作成
    bodyDef.type = type;
    fixDef.shape.SetAsBox(w, h);
    const box = world.CreateBody(bodyDef);
    box.CreateFixture(fixDef);
    box.SetPosition(new b2Vec2(x, y));
    return box;
}

const setPolygon = (x, y, n) => {
    // 多角形の作成
    bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;
    const points = new Array(n);
    for (let i = 0; i < n ; i++) {
	const px = n / 2 * Math.cos(i / n * Math.PI * 2);
	const py = n / 2 * Math.sin(i / n * Math.PI * 2);
	points[i] = new b2Vec2(px, py);
    }
    fixDef.shape.SetAsArray(points, n);
    const polygon = world.CreateBody(bodyDef);
    polygon.CreateFixture(fixDef);
    polygon.SetPosition(new b2Vec2(x, y));
    return polygon;
}

const update = () => {
    // 物理ワールドを更新
    world.Step(1 / 60, 10, 10);
    world.ClearForces();
    // 地面，壁の描画
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#0066CC";
    context.fillRect(0, 59 * scale, 60 * scale, scale);
    context.fillRect(0, 0, scale, 60 * scale);
    context.fillRect(59 * scale, 0, scale, 60 * scale);
    // シーソーの描画
    context.fillRect(29 * scale, 34 * scale, 2 * scale, 2 * scale);
    const pos = bar.GetPosition();
    context.save();
    context.translate(pos.x * scale, pos.y * scale);
    context.rotate(bar.GetAngle());
    context.fillStyle = "#3399FF";
    context.fillRect(-length / 2 * scale, -scale, length * scale, 2 * scale);
    context.restore();
    // ブロックの描画
    for (const block of blocks) {
	const pos = block.obj.GetPosition();
	context.save();
	context.translate(pos.x * scale, pos.y * scale);
	context.rotate(block.obj.GetAngle());
	let [l, color] = [50, "#000000"];
	if (block.obj == selectBlock) { [l, color] = [80, "#FF0000"]; }
	context.fillStyle = `hsl(${(block.n - 3) * 30}, 100%, ${l}%)`;
	context.strokeStyle = color;
	context.beginPath();
	context.moveTo(block.n / 2 * scale, 0);
	for (let i = 1; i <= block.n; i++) {
	    const px = block.n / 2 * Math.cos(i / block.n * Math.PI * 2);
	    const py = block.n / 2 * Math.sin(i / block.n * Math.PI * 2);
	    context.lineTo(px * scale, py * scale);
	}
	context.fill();
	context.stroke();
	context.restore();
    }
    // スコアの表示
    let score = 0;
    for (const block of blocks) {
	const y = block.obj.GetPosition().y;
	if ((block.obj != selectBlock) && (y < 35)) { score += block.n; }
    }
    document.getElementById("score").innerText = score * 100;
}

const getPoint = (event) => {
    // マウスポインタの位置を取得
    const canvasRect = canvas.getBoundingClientRect();
    const x = (event.clientX - canvasRect.left) / scale;
    const y = (event.clientY - canvasRect.top) / scale;
    return [x, y];
}

const reset = () => {
    // シーソー，ブロックを元の位置に戻す
    world.DestroyBody(bar);
    length = document.getElementById("length").value * 10;
    bar = setBox(30, 30, length / 2, 1, Box2D.Dynamics.b2Body.b2_dynamicBody);
    for (let i = 0; i < blocks.length; i++) {
        blocks[i].obj.SetAwake(false);
        const [x, y] = [(i - Math.floor(i / 10) * 10) * 6 + 3, 55 - Math.floor(i / 10) * 5];
        blocks[i].obj.SetPosition(new b2Vec2(x, y));
        blocks[i].obj.SetAwake(true);
    }
}

//
// -EOF-
//