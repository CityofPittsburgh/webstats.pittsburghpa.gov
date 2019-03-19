production:
	bundle exec jekyll build

staging:
	bundle exec jekyll build --config=_config.yml,_staging.yml

dev:
	bundle exec jekyll serve --watch --config=_config.yml,_development.yml

dev-docker:
	bundle exec jekyll serve --host 0.0.0.0 --watch --config=_config.yml,_development.yml

deploy_prod:
	# make production
	make production && aws s3 cp ./_site/* s3://pgh-analytics-reporter-prod --recursive

deploy_staging:
	# make staging
	make staging && aws s3 cp ./_site/* s3://pgh-analytics-reporter-staging --recursive
