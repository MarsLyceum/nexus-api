output "cluster_name" {
  value = google_container_cluster.hephaestus-api-cluster.name
}

output "cluster_ca_certificate" {
  value = base64decode(
    google_container_cluster.hephaestus-api-cluster.master_auth[0].cluster_ca_certificate)
}

output "cluster_location" {
  value = google_container_cluster.hephaestus-api-cluster.location
}

output "cluster_endpoint" {
  value = google_container_cluster.hephaestus-api-cluster.endpoint
}
