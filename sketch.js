let port;
let reader;
let decoder = new TextDecoder();

let pot = 0;
let potSuave = 0;

let conectado = false;

// color actual del pincel
let r, g, b;

function setup() {

  createCanvas(600, 700);

  background(0);

  // primer color aleatorio
  nuevoColor();

  // botón conexión ESP32
  let boton = createButton("Conectar ESP32");
  boton.position(10, 10);
  boton.mousePressed(conectarSerial);
}

function draw() {

  // 🔥 suavizado del potenciómetro
  potSuave = lerp(potSuave, pot, 0.05);

  dibujar();

  mostrarInfo();
}

// =========================
// DIBUJO
// =========================

function dibujar() {

  if (mouseIsPressed) {

    // color fijo actual
    stroke(r, g, b);

    // grosor controlado por potenciómetro
    let grosor = map(
      potSuave,
      0,
      4095,
      10,
      50
    );

    strokeWeight(grosor);

    line(
      pmouseX,
      pmouseY,
      mouseX,
      mouseY
    );
  }
}

// =========================
// NUEVO COLOR RANDOM RGB
// =========================

function nuevoColor() {

  r = random(255);
  g = random(255);
  b = random(255);
}

// =========================
// LIMPIAR Y CAMBIAR COLOR
// =========================

function keyPressed() {

  if (key === 'r' || key === 'R') {

    // borrar fondo
    background(0);

    // nuevo color random
    nuevoColor();
  }
}

// =========================
// INFO
// =========================

function mostrarInfo() {

  noStroke();

  fill(0);
  rect(0, height - 40, 320, 40);

  fill(255);

  textSize(14);

  text(
    "Pot: " + int(potSuave),
    10,
    height - 15
  );

  text(
    "RGB: " +
    int(r) + ", " +
    int(g) + ", " +
    int(b),
    120,
    height - 15
  );
}

// =========================
// SERIAL ESP32
// =========================

async function conectarSerial() {

  if (conectado) return;

  try {

    port = await navigator.serial.requestPort();

    await port.open({
      baudRate: 115200
    });

    conectado = true;

    reader = port.readable.getReader();

    leerLoop();

    console.log("ESP32 conectada");

  } catch (err) {

    console.error(err);
  }
}

async function leerLoop() {

  if (!conectado) return;

  try {

    const { value, done } = await reader.read();

    if (done) {

      reader.releaseLock();
      return;
    }

    if (value) {

      let texto = decoder.decode(value).trim();

      // limpiar caracteres extra
      let soloNumeros = texto.replace(/[^0-9]/g, "");

      let num = parseInt(soloNumeros);

      if (!isNaN(num)) {

        pot = num;
      }
    }

    // seguir leyendo continuamente
    leerLoop();

  } catch (err) {

    console.error("Error lectura:", err);

    conectado = false;
  }
}