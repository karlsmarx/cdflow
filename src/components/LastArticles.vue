<template>
	<div class="contanier-fluid">
		<ul>
			<li class="list-group-item list-group-item-action" v-for="article in Articles" :key="article.id">
				<h3>{{article.title}}</h3><small>{{article.author}}</small>
			</li>
		</ul>
	</div>
</template>

<script>
	export default {
		props: {
			Articles: Array,
		},
		data() {

		},
	}
</script>

