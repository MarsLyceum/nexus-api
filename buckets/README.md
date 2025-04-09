# CORS

To enable our domain to access the Google Storage buckets we need to run this command for each bucket:

```
gsutil cors set cors.json gs://BUCKET_NAME
```
