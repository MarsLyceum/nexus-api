output "kubeconfig" {
  sensitive = true
  value     = <<KUBECONFIG
apiVersion: v1
kind: Config
clusters:
- name: ${google_container_cluster.hephaestus_api_cluster.name}
  cluster:
    certificate-authority-data: ${base64encode(google_container_cluster.hephaestus_api_cluster.master_auth[0].cluster_ca_certificate)}
    server: https://${google_container_cluster.hephaestus_api_cluster.endpoint}
contexts:
- name: ${google_container_cluster.hephaestus_api_cluster.name}
  context:
    cluster: ${google_container_cluster.hephaestus_api_cluster.name}
    user: ${google_container_cluster.hephaestus_api_cluster.name}
users:
- name: ${google_container_cluster.hephaestus_api_cluster.name}
  user:
    # Assuming the use of client-certificate and client-key for authentication; adjust as needed for your auth method
    client-certificate-data: ${base64encode(google_container_cluster.hephaestus_api_cluster.master_auth[0].client_certificate)}
    client-key-data: ${base64encode(google_container_cluster.hephaestus_api_cluster.master_auth[0].client_key)}
current-context: ${google_container_cluster.hephaestus_api_cluster.name}
KUBECONFIG
}
