<template>
  <SolarSystem />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import SolarSystem from './components/SolarSystem.vue';

export default defineComponent({
  name: 'App',
  components: {
    SolarSystem
  }
});
</script>

<style>
body {
  margin: 0;
  padding: 0;
  color: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
</style>
