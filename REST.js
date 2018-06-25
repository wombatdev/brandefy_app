var mysql   = require("mysql");

function REST_ROUTER(router,connection,md5) {
    var self = this;
    self.handleRoutes(router,connection,md5);
}

REST_ROUTER.prototype.handleRoutes = function(router,connection,md5) {
    var self = this;
    router.get("/",function(req,res){
        res.json({"Message" : "Hello World !"});
    });

     router.get("/brands",function(req,res){
        var query = "select b.bid as id,b.b_name as name,rb.id as retailer_id, rb.retailer_name from brands b left join retail_brand rb on b.bid=rb.bid;";
        query = mysql.format(query);
        connection.query(query,function(err,rows){
            if(err) {
                res.json({"Error" : true, "Message" : "Error executing MySQL query"});
            } else {
                
                res.json({"Error" : false, "Message" : "Success", "Search_Results" : rows});
            }
        });
    });

    router.get("/ingredients",function(req,res){
        var query = "select i.id, i.i_name as name, i.synonyms,if(i.issulphate=1,'TRUE','FALSE') as Sulphate, if(i.isparaben=1,'TRUE','FALSE') as Paraben from ingredients i;";
        //var table = [req.params.product_id];
        query = mysql.format(query);
        connection.query(query,function(err,rows){
            if(err) {
                res.json({"Error" : true, "Message" : "Error executing MySQL query"});
            } else {
                res.json({"Error" : false, "Message" : "Success", "product_info" : rows});
            }
        });
    });
    
     router.get("/products",function(req,res){
        var query = " select p.id, p.p_name as name, p.upca, p.brand_id,br.b_name,br.id as retailer_id, br.retailer_name from products p join (select b.bid,b.b_name,rb.id, rb.retailer_name from brands b left join retail_brand rb on b.bid=rb.bid) br on br.bid=p.brand_id;";
        //var table = [req.params.product_id];
        query = mysql.format(query);
        connection.query(query,function(err,rows){
            if(err) {
                res.json({"Error" : true, "Message" : "Error executing MySQL query"});
                console.log(err);
            } else {
                console.log(rows);
                res.json({"Error" : false, "Message" : "Success", "Reviews" : rows});
            }
        });
    });
    
    router.get("/comps",function(req,res){
        var query = " select pc.id,pc.brand_pid,p1.p_name as brand_pname,pc.retailer_pid,p2.p_name as generic_pname, br1.b_name,br2.b_name,br2.retailer_name,pc.overall_similarity,pc.ingredient_match,pc.b_review from product_comp pc join products p1 on p1.id= pc.brand_pid join products p2 on p2.id=pc.retailer_pid join (select b.bid,b.b_name,rb.id, rb.retailer_name from brands b left join retail_brand rb on b.bid=rb.bid) br1 on br1.bid=p1.brand_id join (select b.bid,b.b_name,rb.id, rb.retailer_name from brands b left join retail_brand rb on b.bid=rb.bid) br2 on br2.bid=p2.brand_id;";
        //var table = [req.params.product_id];
        query = mysql.format(query);
        connection.query(query,function(err,rows){
            if(err) {
                res.json({"Error" : true, "Message" : "Error executing MySQL query"});
            } else {
                res.json({"Error" : false, "Message" : "Success", "Reviews" : rows});
            }
        });
    });
}

module.exports = REST_ROUTER;
