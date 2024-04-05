output "cluster_name" {
  value = google_container_cluster.hephaestus_api_cluster.name
}

output "cluster_ca_certificate" {
  value = base64decode(
  google_container_cluster.hephaestus_api_cluster.master_auth[0].cluster_ca_certificate)
}

output "cluster_location" {
  value = google_container_cluster.hephaestus_api_cluster.location
}

output "cluster_endpoint" {
  value = google_container_cluster.hephaestus_api_cluster.endpoint
}
