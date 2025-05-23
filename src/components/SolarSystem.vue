<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { SolarSystem } from '../main/SolarSystem'

const solarSystem = ref<SolarSystem>();

onMounted(() => {
    const canvas = document.querySelector('canvas')!;
    solarSystem.value = new SolarSystem(canvas);
})

function togglePause(event: Event) {
  if (!solarSystem.value) return;

  const target = event.target as HTMLInputElement;
  if (solarSystem.value.isPaused) {
    solarSystem.value.resumeSimulation();
    target.textContent = '||';
  } else {
    solarSystem.value.pauseSimulation();
    target.textContent = '►';
  }
}

function changeSimulationSpeed(event: Event) {
  const target = event.target as HTMLInputElement;
  solarSystem.value?.changeSimulationSpeed(Number(target.value));
}

function focusOn(event: Event) {
  const target = event.target as HTMLInputElement;
  solarSystem.value?.changeCameraTarget(target.dataset.name ?? '');
}

function toggleOrbits(event: Event) {
  solarSystem.value?.toggleOrbits((event.target as HTMLInputElement).checked);  
}
</script>

<template>
  <div id="container">
    <div id="panel">
      <h1>Global settings</h1>
      <div class="button__container">
        <h3>Play/Pause simulation</h3>
        <button @click="togglePause" id="play-pause">||</button>
      </div>
      <div class="button__container">
        <h3>Simulation speed</h3>
        <input @input="changeSimulationSpeed" type="range" min="0" max="1000000" step="10000" id="simulation-speed">
      </div>
      <div class="button__container">
        <h3>Enable orbits</h3>
        <input @change="toggleOrbits" type="checkbox" value="orbits" checked id="orbits">
      </div>
      <div class="separator"></div>
      <h2>Camera settings</h2>
      <button class="planet__element" @click="focusOn" data-name="free">Free camera</button>
      Focus on:
      <div id="planets-list">
        <button class="planet__element" @click="focusOn" data-name="sun">Sun</button>
        <button class="planet__element" @click="focusOn" data-name="mercury">Mercury</button>
        <button class="planet__element" @click="focusOn" data-name="venus">Venus</button>
        <button class="planet__element" @click="focusOn" data-name="earth">Earth</button>
        <button class="planet__element" @click="focusOn" data-name="mars">Mars</button>
        <button class="planet__element" @click="focusOn" data-name="jupiter">Jupiter</button>
        <button class="planet__element" @click="focusOn" data-name="saturn">Saturn</button>
        <button class="planet__element" @click="focusOn" data-name="uranus">Uranus</button>
        <button class="planet__element" @click="focusOn" data-name="neptune">Neptune</button>
      </div>
      <div class="separator"></div>
      <p>
        <i>
        The sizes of planets are 10 times bigger than actual sizes compared to sun. <br>
        The simulation is not an exact representation of the solar system.
        </i>
      </p>
    </div>
    <canvas></canvas>
  </div>
</template>

<style scoped>
#container {
  overflow: hidden;
  display: flex;
  align-items: end;
  justify-content: end;
  height: 100vh;
}

canvas {
  width: 100%;
  position: absolute;
  height: 100vh;
}

.button__container {
  display: flex;
  gap: 15px;
  font-size: .9em;
  align-items: center;
}

.separator {
  width: 100%;
  height: 1px;
  background-color: rgba(96, 96, 96, 1);
  margin-top: 20px;
}

h2 {
  align-self: center;
}

#panel {
  position: relative;
  justify-self: end;
  z-index: 1000;
  padding: 20px 80px 20px 20px;
  margin: 10px;
  border-radius: 15px;
  transition: .25s all;
  background: rgba(96, 96, 96, 0.2);
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid rgba(96, 96, 96, 1);

  display: flex;
  flex-direction: column;
  opacity: .4;

  gap: 10px;
  transform: translateX(100%);
}

#panel:hover {
  opacity: 1;
  transform: translateX(70px);
}

#planets-list {
  display: flex;
  flex-direction: row;
  gap: 5px;
}

button {
  width: 90px;
  height: 30px;
  border-radius: 0;
  filter: none;
  border: none;
  color: white;
  background-color: #111111;
  cursor: pointer;
  transition: .25s all;
}

button:hover {
  background-color: white;
  color: #111111;
}

p {
  font-size: .9em;
  align-self: flex-end;
  text-align: right;
}
h1 {
  margin: 0;
  align-self: center;
}

#simulation-speed {
  right: 20px;
  bottom: 160px;
}

#orbits {
  margin-top: 3px;
}
</style>
