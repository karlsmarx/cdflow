<template>
	<div>
		<Header></Header>
		<div class="container-fluid p-5">
			<div class="row justify-content-left">
				<div class="col-md-auto article-header">
					<h1>
						<slot name="header">{{article.title}}</slot>
					</h1>
				</div>
			</div>
			<hr class="mb-5">
			<div class="row">
				<div class="col-md-auto article-header">
					<slot name="components">{{article.content}}</slot>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
	import Header from '@/components/Header.vue'

	export default {
		props: {
			article: Object,
		},
		components: {
			Header,
		}
	}
</script>
