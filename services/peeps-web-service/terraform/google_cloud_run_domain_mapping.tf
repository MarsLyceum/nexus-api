# resource "google_cloud_run_domain_mapping" "default" {
#   location = "us-west1"
#   name     = "www.hephaestus-api-staging.marslyceum.com" # Your custom domain

#   metadata {
#     namespace = "hephaestus-418809"
#   }

#   spec {
#     route_name = google_cloud_run_service.default.name
#   }
# }
