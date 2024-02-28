<script lang="ts">
    // Who?
    const once = 'twice';

    // I am top level comment in this file.
    import z from 'z';
    import threeLevelRelativePath from "../../../threeLevelRelativePath";

    type Person = {
        handsomness: number;
    }
    const person: Person = {
        handsomness: 10
    }

    import sameLevelRelativePath from "./sameLevelRelativePath";
    import thirdParty from "third-party";

    // 😺
    $: cat = '😺';

    import oneLevelRelativePath from "../oneLevelRelativePath";
    import otherthing from "@core/otherthing";
    import abc from "@core/abc";
    import twoLevelRelativePath from "../../twoLevelRelativePath";
    import component from "@ui/hello";

    onMount(() => {
        console.log('hello');
    })

    import fourLevelRelativePath from "../../../../fourLevelRelativePath";
    import something from "@server/something";
    import xyz from "@ui/xyz";
    import { defineComponent } from 'vue';
	import Header from './Header.svelte';
	import './styles.css';
    import { onMount } from 'svelte';
</script>
