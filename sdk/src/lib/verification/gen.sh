openssl ecparam -genkey -name prime256v1 -noout | openssl pkcs8 -topk8 -nocrypt -out private.pem
openssl ec -in private.pem -pubout -out public.pem
