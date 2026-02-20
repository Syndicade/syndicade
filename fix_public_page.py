import subprocess
result = subprocess.run(['grep', '-c', '<a', '/Users/irmaacuna/Projects/syndicade/src/pages/PublicOrganizationPage.jsx'], capture_output=True, text=True)
print('Current <a count:', result.stdout.strip())
