output "kubeconfig" {
  sensitive = true
  value     = <<KUBECONFIG
apiVersion: v1
kind: Config
clusters:
- name: ${google_container_cluster.this.name}
  cluster:
    certificate-authority-data: ${base64encode(google_container_cluster.this.master_auth[0].cluster_ca_certificate)}
    server: https://${google_container_cluster.this.endpoint}
contexts:
- name: ${google_container_cluster.this.name}
  context:
    cluster: ${google_container_cluster.this.name}
    user: ${google_container_cluster.this.name}
users:
- name: ${google_container_cluster.this.name}
  user:
    # Assuming the use of client-certificate and client-key for authentication; adjust as needed for your auth method
    client-certificate-data: ${base64encode(google_container_cluster.this.master_auth[0].client_certificate)}
    client-key-data: ${base64encode(google_container_cluster.this.master_auth[0].client_key)}
current-context: ${google_container_cluster.this.name}
KUBECONFIG
}
