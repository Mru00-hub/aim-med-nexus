-- Create RPC function to handle user connections
CREATE OR REPLACE FUNCTION create_user_connection(
  requester_id UUID,
  addressee_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Check if connection already exists
  IF EXISTS (
    SELECT 1 FROM user_connections 
    WHERE (requester_id = $1 AND addressee_id = $2) 
       OR (requester_id = $2 AND addressee_id = $1)
  ) THEN
    result := json_build_object('error', 'Connection already exists');
    RETURN result;
  END IF;
  
  -- Insert new connection request
  INSERT INTO user_connections (requester_id, addressee_id, status)
  VALUES ($1, $2, 'pending');
  
  result := json_build_object('success', true, 'message', 'Connection request sent');
  RETURN result;
END;
$$;