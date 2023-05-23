<template>
    <router-view />
</template>

<script lang="ts">
    // This will crash if we try to use the `jsx` parser plugin
    <A>a();
</script>

<style lang="less">
#app {
height: 100%;
background-color: inherit;
}
</style>
