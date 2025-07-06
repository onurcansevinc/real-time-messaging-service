const logger = require('../utils/logger');
const { Client } = require('@elastic/elasticsearch');

const elasticClient = new Client({
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    auth: undefined,
});

const connectElasticsearch = async () => {
    try {
        const health = await elasticClient.cluster.health();
        logger.info('Elasticsearch connected:', health.status);
    } catch (error) {
        logger.error('Elasticsearch connection failed:', error);
        throw error;
    }
};

module.exports = { elasticClient, connectElasticsearch };
