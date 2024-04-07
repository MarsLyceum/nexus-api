resource "google_cloud_run_domain_mapping" "default" {
  location = "us-central1"
  name     = "www.hephaestus-api-staging.marslyceum.com" # Your custom domain

  metadata {
    namespace = google_cloud_run_service.default.location
  }

  spec {
    route_name = google_cloud_run_service.default.name
  }
}
