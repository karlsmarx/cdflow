<template>
  <div id="app">
		<Header></Header>
		<LastArticles v-bind="{ Articles: this.listArticles() }"></LastArticles>
  </div>
</template>

<script>
	import Header from '@/components/Header.vue'
	import LastArticles from '@/components/LastArticles.vue'

	export default {
		components: {
			Header,
			LastArticles,
		},
		data() {
			return {
			}
		},
		methods: {
			getArticle: async () => {},
			listArticles: () => {
				const result = [];
				result.push({
					id: 0,
					title: "Fique rico ou morra tentando",
					content: "A 50 cent movie."
				});

				return result;
			}
		}
	};
</script>